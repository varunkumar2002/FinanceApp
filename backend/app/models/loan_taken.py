# loan_taken.py
from decimal import Decimal
from datetime import date

from sqlalchemy import (
    Integer, String, Numeric, ForeignKey, Date, DateTime,
    Text, Boolean, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class LoanTaken(Base):
    __tablename__ = "loans_taken"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )

    lender_name: Mapped[str] = mapped_column(String(150), nullable=False)
    lender_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    principal_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    outstanding_principal: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    monthly_interest_rate: Mapped[Decimal] = mapped_column(
        Numeric(7, 3), nullable=False, default=Decimal("0.000")
    )

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )