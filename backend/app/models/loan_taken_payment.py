from decimal import Decimal
from datetime import date

from sqlalchemy import (
    Integer, String, Numeric, ForeignKey, Date,
    DateTime, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class LoanTakenPayment(Base):
    __tablename__ = "loan_taken_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    loan_id: Mapped[int] = mapped_column(
        ForeignKey("loans_taken.id"), nullable=False, index=True
    )

    interest_id: Mapped[int | None] = mapped_column(
        ForeignKey("loan_taken_interests.id"), nullable=True, index=True
    )

    payment_type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )