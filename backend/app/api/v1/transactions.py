# transactions.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.category import Category
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionResponse
)
from app.services import transaction_service


router = APIRouter(
    prefix="/transactions",
    tags=["Transaction Management"]
)

# Temporary development user.
# Replace with authenticated user identity when login is implemented.
DEV_USER_ID = 1


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    transaction_type: str | None = None,
    account_id: int | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db)
):
    if transaction_type and transaction_type not in ["income", "expense"]:
        raise HTTPException(
            status_code=400,
            detail="Transaction type must be income or expense"
        )

    return transaction_service.get_transactions(
        db,
        DEV_USER_ID,
        transaction_type,
        account_id,
        category_id
    )


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(
        Category.user_id == DEV_USER_ID
    ).order_by(Category.category_type, Category.name).all()


@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED
)
def add_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db)
):
    try:
        return transaction_service.create_transaction(
            db, DEV_USER_ID, data
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = transaction_service.get_transaction_by_id(
        db, DEV_USER_ID, transaction_id
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
def edit_transaction(
    transaction_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db)
):
    transaction = transaction_service.get_transaction_by_id(
        db, DEV_USER_ID, transaction_id
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    try:
        return transaction_service.update_transaction(
            db, transaction, data, DEV_USER_ID
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.delete("/{transaction_id}")
def remove_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    transaction = transaction_service.get_transaction_by_id(
        db, DEV_USER_ID, transaction_id
    )

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    transaction_service.delete_transaction(db, transaction)

    return {"message": "Transaction deleted successfully"}