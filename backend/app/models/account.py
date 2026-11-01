# account.py
from decimal import Decimal

from sqlalchemy import (
    Integer,
    String,
    Numeric,
    ForeignKey,
    Boolean,
    DateTime,
    func
)

from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Account(Base):

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    account_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    account_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    institution_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True
    )

    opening_balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        default=Decimal("0.00")
    )

    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR"
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
