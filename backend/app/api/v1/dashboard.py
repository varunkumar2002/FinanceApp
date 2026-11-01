
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.services import account_service
from app.services import loan_taken_service


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

DEV_USER_ID = 1


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db)
):

    accounts = account_service.get_all_accounts(
        db,
        DEV_USER_ID
    )

    balance_map = account_service.get_account_balance_map(
        db,
        DEV_USER_ID
    )

    active_accounts = [
        account for account in accounts
        if account.is_active
    ]

    account_data = []

    for account in active_accounts:

        current_balance = balance_map.get(
            account.id,
            account.opening_balance
        )

        account_data.append({
            "id": account.id,
            "account_name": account.account_name,
            "account_type": account.account_type,
            "institution_name": account.institution_name,
            "opening_balance": account.opening_balance,
            "current_balance": current_balance,
            "balance": current_balance,
            "currency": account.currency
        })

    total_balance = sum(
        (
            account["current_balance"]
            for account in account_data
        ),
        Decimal("0.00")
    )

    # Loans Taken and other liabilities will be connected later.
    loan_taken_summary = loan_taken_service.get_loan_summary(
        db,
        DEV_USER_ID
    )

    total_liabilities = (
        loan_taken_summary["outstanding_principal"]
        + loan_taken_summary["outstanding_interest"]
    )

    total_assets = total_balance
    available_balance = total_balance
    net_worth = total_assets - total_liabilities

    recent_transaction_rows = (
        db.query(
            Transaction,
            Category.name.label("category_name")
        )
        .outerjoin(
            Category,
            Transaction.category_id == Category.id
        )
        .filter(
            Transaction.user_id == DEV_USER_ID
        )
        .order_by(
            Transaction.transaction_date.desc(),
            Transaction.created_at.desc()
        )
        .limit(5)
        .all()
    )

    recent_transactions = [
        {
            "id": transaction.id,
            "title": transaction.title,
            "amount": transaction.amount,
            "transaction_type": transaction.transaction_type,
            "transaction_date": transaction.transaction_date,
            "category_name": category_name
        }
        for transaction, category_name in recent_transaction_rows
    ]

    return {
        "total_accounts": len(active_accounts),
        "total_balance": total_balance,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "net_worth": net_worth,
        "available_balance": available_balance,
        "currency": "INR",
        "accounts": account_data,
        "recent_transactions": recent_transactions
    }
