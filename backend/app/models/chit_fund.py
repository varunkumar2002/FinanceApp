
from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    Text,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class ChitFund(Base):
    __tablename__ = "chit_funds"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name = Column(String(150), nullable=False)
    organizer_name = Column(String(150), nullable=False)
    organizer_phone = Column(String(30), nullable=True)

    chit_value = Column(Numeric(15, 2), nullable=False)
    monthly_contribution = Column(Numeric(15, 2), nullable=False)

    total_installments = Column(Integer, nullable=False)

    start_date = Column(Date, nullable=False)
    due_day = Column(Integer, nullable=False, default=10)

    status = Column(String(20), nullable=False, default="active")

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    installments = relationship(
        "ChitInstallment",
        back_populates="chit_fund",
        cascade="all, delete-orphan"
    )

    payments = relationship(
        "ChitPayment",
        back_populates="chit_fund",
        cascade="all, delete-orphan"
    )


class ChitInstallment(Base):
    __tablename__ = "chit_installments"

    __table_args__ = (
        UniqueConstraint(
            "chit_fund_id",
            "installment_number",
            name="uq_chit_installment_number"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    chit_fund_id = Column(
        Integer,
        ForeignKey("chit_funds.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    installment_number = Column(Integer, nullable=False)

    due_date = Column(Date, nullable=False)

    contribution_amount = Column(Numeric(15, 2), nullable=False)

    auction_date = Column(Date, nullable=True)
    bid_amount = Column(Numeric(15, 2), nullable=True)
    dividend_amount = Column(Numeric(15, 2), nullable=True)

    prize_amount = Column(Numeric(15, 2), nullable=True)
    prize_received = Column(Boolean, nullable=False, default=False)

    notes = Column(Text, nullable=True)

    chit_fund = relationship(
        "ChitFund",
        back_populates="installments"
    )

    payments = relationship(
        "ChitPayment",
        back_populates="installment"
    )


class ChitPayment(Base):
    __tablename__ = "chit_payments"

    id = Column(Integer, primary_key=True, index=True)

    chit_fund_id = Column(
        Integer,
        ForeignKey("chit_funds.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    installment_id = Column(
        Integer,
        ForeignKey("chit_installments.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # contribution or prize_received
    payment_type = Column(String(30), nullable=False)

    amount = Column(Numeric(15, 2), nullable=False)

    payment_date = Column(Date, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    chit_fund = relationship(
        "ChitFund",
        back_populates="payments"
    )

    installment = relationship(
        "ChitInstallment",
        back_populates="payments"
    )
