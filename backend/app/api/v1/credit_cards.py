from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.schemas.credit_card import CreditCardCreate, CreditCardUpdate, CreditCardTransactionCreate
from app.services import credit_card_service

router = APIRouter(prefix="/credit-cards", tags=["Credit Cards"])
DEV_USER_ID = 1

@router.get("/")
def list_cards(db: Session = Depends(get_db)):
    return credit_card_service.list_cards(db, DEV_USER_ID)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_card(data: CreditCardCreate, db: Session = Depends(get_db)):
    return credit_card_service.create_card(db, DEV_USER_ID, data)

@router.put("/{card_id}")
def update_card(card_id: int, data: CreditCardUpdate, db: Session = Depends(get_db)):
    card = credit_card_service.get_card(db, DEV_USER_ID, card_id)
    if not card: raise HTTPException(status_code=404, detail="Credit card not found.")
    return credit_card_service.update_card(db, card, data)

@router.get("/{card_id}/transactions")
def list_transactions(card_id: int, db: Session = Depends(get_db)):
    card = credit_card_service.get_card(db, DEV_USER_ID, card_id)
    if not card: raise HTTPException(status_code=404, detail="Credit card not found.")
    return credit_card_service.list_transactions(db, DEV_USER_ID, card_id)

@router.post("/{card_id}/transactions", status_code=status.HTTP_201_CREATED)
def add_transaction(card_id: int, data: CreditCardTransactionCreate, db: Session = Depends(get_db)):
    card = credit_card_service.get_card(db, DEV_USER_ID, card_id)
    if not card: raise HTTPException(status_code=404, detail="Credit card not found.")
    try:
        return credit_card_service.add_card_transaction(db, DEV_USER_ID, card, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
