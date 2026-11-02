# credit_card_service.py
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.credit_card import CreditCard
from app.models.credit_card_transaction import CreditCardTransaction
from app.models.account import Account

DEBIT_TYPES = ("purchase", "interest", "fee")
CREDIT_TYPES = ("payment", "refund")

def card_balance(db: Session, card_id: int, user_id: int) -> Decimal:
    rows = db.query(CreditCardTransaction.transaction_type, func.coalesce(func.sum(CreditCardTransaction.amount), 0)).filter(
        CreditCardTransaction.credit_card_id == card_id,
        CreditCardTransaction.user_id == user_id
    ).group_by(CreditCardTransaction.transaction_type).all()
    totals = {kind: Decimal(str(amount or 0)) for kind, amount in rows}
    return sum((totals.get(k, Decimal("0.00")) for k in DEBIT_TYPES), Decimal("0.00")) - sum(
        (totals.get(k, Decimal("0.00")) for k in CREDIT_TYPES), Decimal("0.00")
    )

def card_response(db: Session, card: CreditCard):
    balance = card_balance(db, card.id, card.user_id)
    return {
        "id": card.id, "user_id": card.user_id, "card_name": card.card_name,
        "issuer": card.issuer, "last_four": card.last_four,
        "credit_limit": card.credit_limit, "statement_day": card.statement_day,
        "due_day": card.due_day, "is_active": card.is_active,
        "outstanding_balance": balance,
        "available_credit": card.credit_limit - balance
    }

def list_cards(db: Session, user_id: int):
    cards = db.query(CreditCard).filter(CreditCard.user_id == user_id).order_by(CreditCard.created_at.desc()).all()
    return [card_response(db, card) for card in cards]

def create_card(db: Session, user_id: int, data):
    card = CreditCard(user_id=user_id, **data.model_dump())
    db.add(card); db.commit(); db.refresh(card)
    return card_response(db, card)

def get_card(db: Session, user_id: int, card_id: int):
    return db.query(CreditCard).filter(CreditCard.id == card_id, CreditCard.user_id == user_id).first()

def update_card(db: Session, card: CreditCard, data):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(card, key, value)
    db.commit(); db.refresh(card)
    return card_response(db, card)

def add_card_transaction(db: Session, user_id: int, card: CreditCard, data):
    if data.transaction_type == "payment":
        if not data.account_id:
            raise ValueError("Select the bank or cash account used for this payment.")
        account = db.query(Account).filter(Account.id == data.account_id, Account.user_id == user_id, Account.is_active == True).first()
        if not account:
            raise ValueError("The selected account was not found or is inactive.")
        if data.amount > card_balance(db, card.id, user_id):
            raise ValueError("Payment cannot exceed the current outstanding card balance.")
    elif data.account_id is not None:
        raise ValueError("A bank account is only required for card payments.")
    if data.transaction_type == "refund" and data.amount > card_balance(db, card.id, user_id):
        raise ValueError("Refund cannot exceed the current outstanding card balance.")
    entry = CreditCardTransaction(user_id=user_id, credit_card_id=card.id, **data.model_dump())
    db.add(entry); db.commit(); db.refresh(entry)
    return transaction_response(entry)

def transaction_response(row):
    return {"id": row.id, "credit_card_id": row.credit_card_id, "account_id": row.account_id,
            "transaction_type": row.transaction_type, "title": row.title, "amount": row.amount,
            "transaction_date": row.transaction_date, "notes": row.notes}

def list_transactions(db: Session, user_id: int, card_id: int):
    rows = db.query(CreditCardTransaction).filter(
        CreditCardTransaction.user_id == user_id,
        CreditCardTransaction.credit_card_id == card_id
    ).order_by(CreditCardTransaction.transaction_date.desc(), CreditCardTransaction.created_at.desc()).all()
    return [transaction_response(row) for row in rows]

def get_total_outstanding(db: Session, user_id: int) -> Decimal:
    cards = db.query(CreditCard).filter(CreditCard.user_id == user_id).all()
    return sum((card_balance(db, card.id, user_id) for card in cards), Decimal("0.00"))
