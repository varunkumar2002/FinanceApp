
from datetime import date
from decimal import Decimal
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict


class ChitFundCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    organizer_name: str = Field(min_length=1, max_length=150)

    organizer_phone: Optional[str] = None

    chit_value: Decimal = Field(gt=0)
    monthly_contribution: Decimal = Field(gt=0)

    total_installments: int = Field(gt=0, le=120)

    start_date: date

    due_day: int = Field(default=10, ge=1, le=28)

    notes: Optional[str] = None


class ChitFundUpdate(ChitFundCreate):
    status: Literal["active", "completed", "paused"] = "active"


class ChitInstallmentUpdate(BaseModel):
    auction_date: Optional[date] = None

    bid_amount: Optional[Decimal] = Field(default=None, ge=0)

    dividend_amount: Optional[Decimal] = Field(default=None, ge=0)

    prize_amount: Optional[Decimal] = Field(default=None, ge=0)

    prize_received: bool = False

    notes: Optional[str] = None


class ChitPaymentCreate(BaseModel):
    installment_id: Optional[int] = None

    payment_type: Literal[
        "contribution",
        "prize_received"
    ]

    amount: Decimal = Field(gt=0)

    payment_date: date

    notes: Optional[str] = None


class ChitPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chit_fund_id: int
    installment_id: Optional[int]

    payment_type: str
    amount: Decimal
    payment_date: date
    notes: Optional[str]


class ChitInstallmentResponse(BaseModel):
    id: int
    installment_number: int
    due_date: date

    contribution_amount: Decimal
    amount_paid: Decimal
    outstanding_amount: Decimal

    status: str

    auction_date: Optional[date]
    bid_amount: Optional[Decimal]
    dividend_amount: Optional[Decimal]

    prize_amount: Optional[Decimal]
    prize_received: bool

    notes: Optional[str]


class ChitFundResponse(BaseModel):
    id: int

    name: str
    organizer_name: str
    organizer_phone: Optional[str]

    chit_value: Decimal
    monthly_contribution: Decimal
    total_installments: int

    start_date: date
    due_day: int

    status: str
    notes: Optional[str]

    total_contributed: Decimal
    outstanding_contributions: Decimal
    total_prize_received: Decimal

    installments_paid: int

    installments: list[ChitInstallmentResponse] = []
