from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.account_transfer import (
    AccountTransferCreate,
    AccountTransferResponse
)

from app.services import account_transfer_service


router = APIRouter(
    prefix="/transfers",
    tags=["Account Transfers"]
)

DEV_USER_ID = 1


@router.get(
    "/",
    response_model=list[AccountTransferResponse]
)
def list_transfers(
    db: Session = Depends(get_db)
):
    return account_transfer_service.get_transfers(
        db,
        DEV_USER_ID
    )


@router.post(
    "/",
    response_model=AccountTransferResponse,
    status_code=status.HTTP_201_CREATED
)
def create_new_transfer(
    data: AccountTransferCreate,
    db: Session = Depends(get_db)
):
    try:
        return account_transfer_service.create_transfer(
            db,
            DEV_USER_ID,
            data
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )