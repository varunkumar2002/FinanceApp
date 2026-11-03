from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.connection import Base


class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    name = Column(String(150), nullable=False)
    symbol = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False) # e.g., 'stocks', 'mutual_funds'
    
    # New SIP & Equity Configuration fields
    investment_mode = Column(String(20), nullable=False, default="lumpsum") # 'lumpsum' or 'sip'
    initial_invested_amount = Column(Numeric(15, 2), nullable=False, default=0)
    monthly_sip_amount = Column(Numeric(15, 2), nullable=False, default=0)
    sip_deduction_date = Column(Integer, nullable=True) # Day of the month (1-31)
    primary_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True) # Linked bank account

    # Current market price per unit.
    current_price = Column(Numeric(15, 2), nullable=False, default=0)

    # Date of the most recent manual price update.
    price_updated_at = Column(Date, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    transactions = relationship(
        "InvestmentTransaction",
        back_populates="investment",
        cascade="all, delete-orphan",
    )
    
    primary_account = relationship("Account", foreign_keys=[primary_account_id])


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id = Column(Integer, primary_key=True, index=True)

    investment_id = Column(
        Integer,
        ForeignKey("investments.id", ondelete="CASCADE"),
        nullable=False,
    )

    transaction_type = Column(String(20), nullable=False)

    quantity = Column(Numeric(15, 4), nullable=False, default=0)

    unit_price = Column(Numeric(15, 2), nullable=False, default=0)

    amount = Column(Numeric(15, 2), nullable=False)

    transaction_date = Column(Date, nullable=False)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    investment = relationship(
        "Investment",
        back_populates="transactions",
    )

    __table_args__ = (
        CheckConstraint(
            "transaction_type IN ('buy', 'sell', 'dividend', 'sip_deduction')",
            name="check_investment_transaction_type",
        ),
    )