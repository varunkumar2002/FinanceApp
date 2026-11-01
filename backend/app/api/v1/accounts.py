# accounts.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.transaction import Transaction
from app.models.account_transfer import AccountTransfer

from app.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse
)

from app.services import account_service


router = APIRouter(
    prefix="/accounts",
    tags=["Account Management"]
)


DEV_USER_ID = 1


@router.get("/", response_model=list[AccountResponse])
def list_accounts(
    db: Session = Depends(get_db)
):

    return account_service.get_accounts_with_balances(
        db,
        DEV_USER_ID
    )


@router.get("/summary")
def account_summary(
    db: Session = Depends(get_db)
):

    return account_service.get_account_summary(
        db,
        DEV_USER_ID
    )


@router.post(
    "/",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_account(
    account_data: AccountCreate,
    db: Session = Depends(get_db)
):

    return account_service.create_account(
        db,
        DEV_USER_ID,
        account_data
    )


@router.get(
    "/{account_id}",
    response_model=AccountResponse
)
def get_account(
    account_id: int,
    db: Session = Depends(get_db)
):

    account = account_service.get_account_by_id(
        db,
        DEV_USER_ID,
        account_id
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    return account_service.account_to_response(
        db,
        account
    )


@router.put(
    "/{account_id}",
    response_model=AccountResponse
)
def update_existing_account(
    account_id: int,
    account_data: AccountUpdate,
    db: Session = Depends(get_db)
):

    account = account_service.get_account_by_id(
        db,
        DEV_USER_ID,
        account_id
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    return account_service.update_account(
        db,
        account,
        account_data
    )


@router.delete("/{account_id}")
def remove_account(
    account_id: int,
    db: Session = Depends(get_db)
):

    account = account_service.get_account_by_id(
        db,
        DEV_USER_ID,
        account_id
    )

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found"
        )

    transaction_exists = (
        db.query(Transaction)
        .filter(
            Transaction.account_id == account_id,
            Transaction.user_id == DEV_USER_ID
        )
        .first()
    )

    if transaction_exists:
        raise HTTPException(
            status_code=400,
            detail="Account has transactions and cannot be deleted"
        )

    transfer_exists = (
        db.query(AccountTransfer)
        .filter(
            AccountTransfer.user_id == DEV_USER_ID,
            (
                (AccountTransfer.from_account_id == account_id)
                |
                (AccountTransfer.to_account_id == account_id)
            )
        )
        .first()
    )

    if transfer_exists:
        raise HTTPException(
            status_code=400,
            detail="Account has transfer history and cannot be deleted"
        )

    account_service.delete_account(
        db,
        account
    )

    return {
        "message": "Account deleted successfully"
    }
