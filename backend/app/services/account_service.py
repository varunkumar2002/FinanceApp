# account_service.py
from decimal import Decimal

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.account_transfer import AccountTransfer
from app.models.credit_card_transaction import CreditCardTransaction

from app.schemas.account import AccountCreate, AccountUpdate


def get_account_balance_map(
    db: Session,
    user_id: int
):
    rows = (
        db.query(
            Transaction.account_id,
            func.sum(
                case(
                    (
                        Transaction.transaction_type == "income",
                        Transaction.amount
                    ),
                    else_=Decimal("0.00")
                )
            ).label("total_income"),
            func.sum(
                case(
                    (
                        Transaction.transaction_type == "expense",
                        Transaction.amount
                    ),
                    else_=Decimal("0.00")
                )
            ).label("total_expense")
        )
        .filter(Transaction.user_id == user_id)
        .group_by(Transaction.account_id)
        .all()
    )

    transaction_totals = {}

    for row in rows:
        transaction_totals[row.account_id] = {
            "income": Decimal(str(row.total_income or 0)),
            "expense": Decimal(str(row.total_expense or 0))
        }

    transfer_rows = (
        db.query(
            AccountTransfer.from_account_id,
            func.sum(AccountTransfer.amount).label("outgoing")
        )
        .filter(AccountTransfer.user_id == user_id)
        .group_by(AccountTransfer.from_account_id)
        .all()
    )

    outgoing_transfers = {
        row.from_account_id: Decimal(str(row.outgoing or 0))
        for row in transfer_rows
    }

    transfer_rows = (
        db.query(
            AccountTransfer.to_account_id,
            func.sum(AccountTransfer.amount).label("incoming")
        )
        .filter(AccountTransfer.user_id == user_id)
        .group_by(AccountTransfer.to_account_id)
        .all()
    )

    incoming_transfers = {
        row.to_account_id: Decimal(str(row.incoming or 0))
        for row in transfer_rows
    }

    card_payment_rows = (
        db.query(
            CreditCardTransaction.account_id,
            func.sum(CreditCardTransaction.amount).label("card_payments")
        )
        .filter(
            CreditCardTransaction.user_id == user_id,
            CreditCardTransaction.transaction_type == "payment",
            CreditCardTransaction.account_id.isnot(None)
        )
        .group_by(CreditCardTransaction.account_id)
        .all()
    )
    card_payments_by_account = {
        row.account_id: Decimal(str(row.card_payments or 0))
        for row in card_payment_rows
    }

    accounts = (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .all()
    )

    balance_map = {}

    for account in accounts:
        totals = transaction_totals.get(
            account.id,
            {
                "income": Decimal("0.00"),
                "expense": Decimal("0.00")
            }
        )

        balance_map[account.id] = (
            account.opening_balance
            + totals["income"]
            - totals["expense"]
            - outgoing_transfers.get(
                account.id,
                Decimal("0.00")
            )
            + incoming_transfers.get(
                account.id,
                Decimal("0.00")
            )
            - card_payments_by_account.get(account.id, Decimal("0.00"))
        )

    return balance_map


def account_to_response(
    db: Session,
    account: Account
):
    balance_map = get_account_balance_map(
        db,
        account.user_id
    )

    return {
        "id": account.id,
        "user_id": account.user_id,
        "account_name": account.account_name,
        "account_type": account.account_type,
        "institution_name": account.institution_name,
        "opening_balance": account.opening_balance,
        "current_balance": balance_map.get(
            account.id,
            account.opening_balance
        ),
        "currency": account.currency,
        "is_active": account.is_active
    }


def get_all_accounts(db: Session, user_id: int):

    return (
        db.query(Account)
        .filter(Account.user_id == user_id)
        .order_by(Account.created_at.desc())
        .all()
    )


def get_accounts_with_balances(
    db: Session,
    user_id: int
):
    accounts = get_all_accounts(db, user_id)
    balance_map = get_account_balance_map(db, user_id)

    return [
        {
            "id": account.id,
            "user_id": account.user_id,
            "account_name": account.account_name,
            "account_type": account.account_type,
            "institution_name": account.institution_name,
            "opening_balance": account.opening_balance,
            "current_balance": balance_map.get(
                account.id,
                account.opening_balance
            ),
            "currency": account.currency,
            "is_active": account.is_active
        }
        for account in accounts
    ]


def get_account_summary(
    db: Session,
    user_id: int
):
    accounts = get_all_accounts(db, user_id)
    balance_map = get_account_balance_map(db, user_id)

    active_accounts = [
        account for account in accounts
        if account.is_active
    ]

    total_opening_balance = sum(
        (
            account.opening_balance
            for account in active_accounts
        ),
        Decimal("0.00")
    )

    total_current_balance = sum(
        (
            balance_map.get(
                account.id,
                account.opening_balance
            )
            for account in active_accounts
        ),
        Decimal("0.00")
    )

    return {
        "total_accounts": len(accounts),
        "active_accounts": len(active_accounts),
        "total_opening_balance": total_opening_balance,
        "total_current_balance": total_current_balance,
        "currency": "INR"
    }


def get_account_by_id(
    db: Session,
    user_id: int,
    account_id: int
):
    return (
        db.query(Account)
        .filter(
            Account.id == account_id,
            Account.user_id == user_id
        )
        .first()
    )


def create_account(
    db: Session,
    user_id: int,
    account_data: AccountCreate
):
    account = Account(
        user_id=user_id,
        **account_data.model_dump()
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return account_to_response(db, account)


def update_account(
    db: Session,
    account: Account,
    account_data: AccountUpdate
):
    update_data = account_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)

    return account_to_response(db, account)


def delete_account(
    db: Session,
    account: Account
):
    db.delete(account)
    db.commit()

    return True