
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.chit_fund import (
    ChitFundCreate,
    ChitFundUpdate,
    ChitInstallmentUpdate,
    ChitPaymentCreate,
)

from app.services import chit_fund_service as service


router = APIRouter(
    prefix="/chit-funds",
    tags=["Chit Funds"]
)

# Same development-user convention as your existing APIs.
# Replace with your authenticated user dependency when ready.
DEV_USER_ID = 1


@router.get("/")
def list_chit_funds(
    db: Session = Depends(get_db)
):
    return service.list_funds(db, DEV_USER_ID)


@router.get("/summary")
def chit_fund_summary(
    db: Session = Depends(get_db)
):
    return service.get_summary(db, DEV_USER_ID)


@router.post("/")
def create_chit_fund(
    payload: ChitFundCreate,
    db: Session = Depends(get_db)
):
    return service.create_fund(
        db,
        DEV_USER_ID,
        payload
    )


@router.get("/{fund_id}")
def get_chit_fund(
    fund_id: int,
    db: Session = Depends(get_db)
):
    fund = service.get_fund(
        db,
        DEV_USER_ID,
        fund_id
    )

    return service.get_fund_details(db, fund)


@router.put("/{fund_id}")
def update_chit_fund(
    fund_id: int,
    payload: ChitFundUpdate,
    db: Session = Depends(get_db)
):
    return service.update_fund(
        db,
        DEV_USER_ID,
        fund_id,
        payload
    )


@router.put("/{fund_id}/installments/{installment_id}")
def update_chit_installment(
    fund_id: int,
    installment_id: int,
    payload: ChitInstallmentUpdate,
    db: Session = Depends(get_db)
):
    return service.update_installment(
        db,
        DEV_USER_ID,
        fund_id,
        installment_id,
        payload
    )


@router.get("/{fund_id}/payments")
def list_chit_payments(
    fund_id: int,
    db: Session = Depends(get_db)
):
    return service.get_payments(
        db,
        DEV_USER_ID,
        fund_id
    )


@router.post("/{fund_id}/payments")
def create_chit_payment(
    fund_id: int,
    payload: ChitPaymentCreate,
    db: Session = Depends(get_db)
):
    return service.add_payment(
        db,
        DEV_USER_ID,
        fund_id,
        payload
    )
