from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, ConfigDict


class AccountTransferCreate(BaseModel):

    from_account_id: int = Field(gt=0)

    to_account_id: int = Field(gt=0)

    amount: Decimal = Field(
        gt=0,
        max_digits=15,
        decimal_places=2
    )

    transfer_date: date

    notes: str | None = Field(
        default=None,
        max_length=500
    )


class AccountTransferResponse(BaseModel):

    id: int
    user_id: int

    from_account_id: int
    to_account_id: int

    from_account_name: str
    to_account_name: str

    amount: Decimal
    transfer_date: date
    notes: str | None

    model_config = ConfigDict(
        from_attributes=True
    )