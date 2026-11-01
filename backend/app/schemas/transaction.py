from decimal import Decimal
from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


TransactionType = Literal["income", "expense"]


class TransactionCreate(BaseModel):
    account_id: int
    category_id: int
    title: str = Field(min_length=2, max_length=150)
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    transaction_type: TransactionType
    transaction_date: date
    notes: str | None = None


class TransactionUpdate(BaseModel):
    account_id: int | None = None
    category_id: int | None = None
    title: str | None = Field(default=None, min_length=2, max_length=150)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=15, decimal_places=2
    )
    transaction_type: TransactionType | None = None
    transaction_date: date | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    category_id: int
    title: str
    amount: Decimal
    transaction_type: str
    transaction_date: date
    notes: str | None

    model_config = ConfigDict(from_attributes=True)     