from decimal import Decimal
from datetime import date

from sqlalchemy import (
    Integer, Numeric, ForeignKey, Date, DateTime,
    String, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class LoanTakenInterest(Base):
    __tablename__ = "loan_taken_interests"

    __table_args__ = (
        UniqueConstraint(
            "loan_id",
            "period_month",
            name="uq_loan_taken_interest_month",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    loan_id: Mapped[int] = mapped_column(
        ForeignKey("loans_taken.id"), nullable=False, index=True
    )

    period_month: Mapped[date] = mapped_column(Date, nullable=False)
    principal_basis: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    interest_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)

    amount_paid: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0.00")
    )

    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending"
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )