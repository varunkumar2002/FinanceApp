from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


PaymentType = Literal["principal", "interest"]


class LoanTakenCreate(BaseModel):
    lender_name: str = Field(min_length=2, max_length=150)
    lender_phone: str | None = Field(default=None, max_length=20)

    principal_amount: Decimal = Field(
        gt=0, max_digits=15, decimal_places=2
    )

    monthly_interest_rate: Decimal = Field(
        default=Decimal("0.000"),
        ge=0,
        max_digits=7,
        decimal_places=3,
    )

    start_date: date
    due_date: date | None = None
    notes: str | None = None


class LoanTakenUpdate(BaseModel):
    lender_name: str | None = Field(default=None, min_length=2, max_length=150)
    lender_phone: str | None = Field(default=None, max_length=20)

    principal_amount: Decimal | None = Field(
        default=None, gt=0, max_digits=15, decimal_places=2
    )

    monthly_interest_rate: Decimal | None = Field(
        default=None, ge=0, max_digits=7, decimal_places=3
    )

    start_date: date | None = None
    due_date: date | None = None
    notes: str | None = None
    is_active: bool | None = None


class LoanTakenResponse(BaseModel):
    id: int
    user_id: int
    lender_name: str
    lender_phone: str | None
    principal_amount: Decimal
    outstanding_principal: Decimal
    monthly_interest_rate: Decimal
    start_date: date
    due_date: date | None
    notes: str | None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class LoanTakenInterestResponse(BaseModel):
    id: int
    loan_id: int
    period_month: date
    principal_basis: Decimal
    interest_amount: Decimal
    amount_paid: Decimal
    due_date: date
    status: str

    model_config = ConfigDict(from_attributes=True)


class LoanTakenPaymentResponse(BaseModel):
    id: int
    loan_id: int
    interest_id: int | None
    payment_type: str
    amount: Decimal
    payment_date: date
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class LoanTakenDetailResponse(LoanTakenResponse):
    total_interest_generated: Decimal
    total_interest_paid: Decimal
    outstanding_interest: Decimal
    interests: list[LoanTakenInterestResponse]
    payments: list[LoanTakenPaymentResponse]


class LoanPaymentCreate(BaseModel):
    payment_type: PaymentType
    amount: Decimal = Field(gt=0, max_digits=15, decimal_places=2)
    payment_date: date
    interest_id: int | None = None
    notes: str | None = None


class LoanTakenSummaryResponse(BaseModel):
    total_loans: int
    active_loans: int
    closed_loans: int
    total_principal_borrowed: Decimal
    outstanding_principal: Decimal
    total_interest_generated: Decimal
    total_interest_paid: Decimal
    outstanding_interest: Decimal