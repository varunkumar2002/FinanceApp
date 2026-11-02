from decimal import Decimal
from sqlalchemy import Integer, String, Numeric, Date, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.connection import Base

class CreditCard(Base):
    __tablename__ = "credit_cards"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    card_name: Mapped[str] = mapped_column(String(100), nullable=False)
    issuer: Mapped[str] = mapped_column(String(100), nullable=False)
    last_four: Mapped[str] = mapped_column(String(4), nullable=False)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    statement_day: Mapped[int] = mapped_column(Integer, nullable=False)
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
