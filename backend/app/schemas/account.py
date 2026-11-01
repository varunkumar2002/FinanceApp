# backend/app/schemas/account.py
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


AccountType = Literal[
    "bank",
    "cash",
    "wallet",
    "other"
]


class AccountCreate(BaseModel):

    account_name: str = Field(
        min_length=2,
        max_length=100
    )

    account_type: AccountType

    institution_name: str | None = Field(
        default=None,
        max_length=150
    )

    opening_balance: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        max_digits=15,
        decimal_places=2
    )

    currency: str = Field(
        default="INR",
        pattern=r"^[A-Z]{3}$"
    )


class AccountUpdate(BaseModel):

    account_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    account_type: AccountType | None = None

    institution_name: str | None = Field(
        default=None,
        max_length=150
    )

    opening_balance: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=15,
        decimal_places=2
    )

    currency: str | None = Field(
        default=None,
        pattern=r"^[A-Z]{3}$"
    )

    is_active: bool | None = None


class AccountResponse(BaseModel):

    id: int
    user_id: int
    account_name: str
    account_type: str
    institution_name: str | None
    opening_balance: Decimal
    current_balance: Decimal
    currency: str
    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )
