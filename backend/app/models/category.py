from sqlalchemy import (
    Integer, String, ForeignKey
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.connection import Base


class Category(Base):

    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    category_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )