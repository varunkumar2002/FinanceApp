from datetime import date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict

CardTransactionType = Literal["purchase", "payment", "refund", "interest", "fee"]

class CreditCardCreate(BaseModel):
    card_name: str = Field(min_length=2, max_length=100)
    issuer: str = Field(min_length=2, max_length=100)
    last_four: str = Field(pattern=r"^\d{4}$")
    credit_limit: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    statement_day: int = Field(ge=1, le=31)
    due_day: int = Field(ge=1, le=31)

class CreditCardUpdate(BaseModel):
    card_name: str | None = Field(default=None, min_length=2, max_length=100)
    issuer: str | None = Field(default=None, min_length=2, max_length=100)
    credit_limit: Decimal | None = Field(default=None, gt=0, max_digits=15, decimal_places=2)
    statement_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    is_active: bool | None = None

class CreditCardTransactionCreate(BaseModel):
    transaction_type: CardTransactionType
    title: str = Field(min_length=2, max_length=200)
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    transaction_date: date
    account_id: int | None = None
    notes: str | None = None

class CreditCardResponse(BaseModel):
    id: int
    user_id: int
    card_name: str
    issuer: str
    last_four: str
    credit_limit: Decimal
    statement_day: int
    due_day: int
    is_active: bool
    outstanding_balance: Decimal
    available_credit: Decimal
    model_config = ConfigDict(from_attributes=True)
