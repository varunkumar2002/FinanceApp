from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentUpdate,
    InvestmentTransactionCreate,
)
from app.services import investment_service as service


router = APIRouter(
    prefix="/investments",
    tags=["Investments"],
)


@router.get("/")
def list_investments(db: Session = Depends(get_db)):
    return service.list_investments(db)


@router.get("/summary")
def investment_summary(db: Session = Depends(get_db)):
    return service.get_summary(db)


@router.post("/")
def create_investment(
    data: InvestmentCreate,
    db: Session = Depends(get_db),
):
    return service.create_investment(db, data)


@router.get("/{investment_id}")
def get_investment(
    investment_id: int,
    db: Session = Depends(get_db),
):
    investment = service.get_investment(db, investment_id)
    return service.investment_response(investment)


@router.put("/{investment_id}")
def update_investment(
    investment_id: int,
    data: InvestmentUpdate,
    db: Session = Depends(get_db),
):
    return service.update_investment(db, investment_id, data)


@router.delete("/{investment_id}")
def delete_investment(
    investment_id: int,
    db: Session = Depends(get_db),
):
    return service.delete_investment(db, investment_id)


@router.get("/{investment_id}/transactions")
def get_transactions(
    investment_id: int,
    db: Session = Depends(get_db),
):
    return service.get_transactions(db, investment_id)


@router.post("/{investment_id}/transactions")
def add_transaction(
    investment_id: int,
    data: InvestmentTransactionCreate,
    db: Session = Depends(get_db),
):
    return service.add_transaction(db, investment_id, data)