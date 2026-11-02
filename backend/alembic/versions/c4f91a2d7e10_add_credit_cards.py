
"""add credit cards and card ledger

Revision ID: c4f91a2d7e10
Revises: 90a7d00ddb1e
Create Date: 2026-11-02
"""

from alembic import op
import sqlalchemy as sa

revision = "c4f91a2d7e10"
down_revision = "90a7d00ddb1e"
branch_labels = None
depends_on = None


def upgrade():

    # Credit cards table
    op.create_table(
        "credit_cards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False
        ),
        sa.Column("card_name", sa.String(100), nullable=False),
        sa.Column("issuer", sa.String(100), nullable=False),
        sa.Column("last_four", sa.String(4), nullable=False),
        sa.Column("credit_limit", sa.Numeric(15, 2), nullable=False),
        sa.Column("statement_day", sa.Integer(), nullable=False),
        sa.Column("due_day", sa.Integer(), nullable=False),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true()
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        ),
    )

    op.create_index(
        "ix_credit_cards_id",
        "credit_cards",
        ["id"]
    )

    op.create_index(
        "ix_credit_cards_user_id",
        "credit_cards",
        ["user_id"]
    )

    # Credit card transactions table
    op.create_table(
        "credit_card_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id"),
            nullable=False
        ),
        sa.Column(
            "credit_card_id",
            sa.Integer(),
            sa.ForeignKey("credit_cards.id", ondelete="CASCADE"),
            nullable=False
        ),
        sa.Column(
            "account_id",
            sa.Integer(),
            sa.ForeignKey("accounts.id"),
            nullable=True
        ),
        sa.Column("transaction_type", sa.String(20), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        ),
        sa.CheckConstraint(
            "transaction_type IN "
            "('purchase','payment','refund','interest','fee')",
            name="ck_credit_card_transaction_type"
        ),
    )

    op.create_index(
        "ix_credit_card_transactions_id",
        "credit_card_transactions",
        ["id"]
    )

    op.create_index(
        "ix_credit_card_transactions_user_id",
        "credit_card_transactions",
        ["user_id"]
    )

    op.create_index(
        "ix_credit_card_transactions_credit_card_id",
        "credit_card_transactions",
        ["credit_card_id"]
    )

    op.create_index(
        "ix_credit_card_transactions_account_id",
        "credit_card_transactions",
        ["account_id"]
    )


def downgrade():

    # Dropping tables automatically removes their indexes.
    op.drop_table("credit_card_transactions")
    op.drop_table("credit_cards")
