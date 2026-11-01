from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

# Use the same Base import used by your existing SQLAlchemy models.
from app.database.connection import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )

    # General preferences
    currency = Column(String(10), nullable=False, default="INR")
    date_format = Column(String(20), nullable=False, default="DD/MM/YYYY")
    theme = Column(String(20), nullable=False, default="light")

    # Reminder preferences
    loan_reminders = Column(Boolean, nullable=False, default=True)
    chit_fund_reminders = Column(Boolean, nullable=False, default=True)
    payment_reminders = Column(Boolean, nullable=False, default=True)
    reminder_days_before = Column(Integer, nullable=False, default=3)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )