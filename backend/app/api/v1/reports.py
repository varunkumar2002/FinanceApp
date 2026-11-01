
from datetime import date
from decimal import Decimal
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.connection import get_db
from app.models.transaction import Transaction
from app.models.account import Account

# Include this import if you have implemented account transfers.
from app.models.account_transfer import AccountTransfer


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)

DEV_USER_ID = 1


def money(value):
    return float(value or 0)


@router.get("/summary")
def get_reports_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db)
):
    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date."
        )

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == DEV_USER_ID,
            Transaction.transaction_date >= start_date,
            Transaction.transaction_date <= end_date
        )
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    total_income = Decimal("0.00")
    total_expenses = Decimal("0.00")

    monthly_data = defaultdict(
        lambda: {
            "income": Decimal("0.00"),
            "expenses": Decimal("0.00")
        }
    )

    category_data = defaultdict(
        lambda: Decimal("0.00")
    )

    transaction_rows = []

    for transaction in transactions:
        amount = Decimal(str(transaction.amount or 0))

        month_key = transaction.transaction_date.strftime("%Y-%m")

        if transaction.transaction_type == "income":
            total_income += amount
            monthly_data[month_key]["income"] += amount

        elif transaction.transaction_type == "expense":
            total_expenses += amount
            monthly_data[month_key]["expenses"] += amount

            category_key = (
                transaction.category_id
                if transaction.category_id is not None
                else "uncategorized"
            )

            category_data[str(category_key)] += amount

        transaction_rows.append({
            "id": transaction.id,
            "title": transaction.title,
            "amount": money(amount),
            "transaction_type": transaction.transaction_type,
            "transaction_date": transaction.transaction_date.isoformat(),
            "account_id": transaction.account_id,
            "category_id": transaction.category_id,
            "notes": transaction.notes
        })

    monthly_report = []

    for month in sorted(monthly_data.keys()):
        income = monthly_data[month]["income"]
        expenses = monthly_data[month]["expenses"]

        monthly_report.append({
            "month": month,
            "income": money(income),
            "expenses": money(expenses),
            "savings": money(income - expenses)
        })

    category_report = [
        {
            "category_id": category_id,
            "amount": money(amount)
        }
        for category_id, amount in sorted(
            category_data.items(),
            key=lambda item: item[1],
            reverse=True
        )
    ]

    # Current account balances.
    accounts = (
        db.query(Account)
        .filter(
            Account.user_id == DEV_USER_ID,
            Account.is_active == True
        )
        .order_by(Account.account_name)
        .all()
    )

    account_ids = [account.id for account in accounts]

    income_by_account = dict(
        db.query(
            Transaction.account_id,
            func.coalesce(func.sum(Transaction.amount), 0)
        )
        .filter(
            Transaction.user_id == DEV_USER_ID,
            Transaction.transaction_type == "income",
            Transaction.account_id.in_(account_ids)
        )
        .group_by(Transaction.account_id)
        .all()
    ) if account_ids else {}

    expenses_by_account = dict(
        db.query(
            Transaction.account_id,
            func.coalesce(func.sum(Transaction.amount), 0)
        )
        .filter(
            Transaction.user_id == DEV_USER_ID,
            Transaction.transaction_type == "expense",
            Transaction.account_id.in_(account_ids)
        )
        .group_by(Transaction.account_id)
        .all()
    ) if account_ids else {}

    outgoing_transfers = {}
    incoming_transfers = {}

    if account_ids:
        outgoing_transfers = dict(
            db.query(
                AccountTransfer.from_account_id,
                func.coalesce(func.sum(AccountTransfer.amount), 0)
            )
            .filter(
                AccountTransfer.user_id == DEV_USER_ID,
                AccountTransfer.from_account_id.in_(account_ids)
            )
            .group_by(AccountTransfer.from_account_id)
            .all()
        )

        incoming_transfers = dict(
            db.query(
                AccountTransfer.to_account_id,
                func.coalesce(func.sum(AccountTransfer.amount), 0)
            )
            .filter(
                AccountTransfer.user_id == DEV_USER_ID,
                AccountTransfer.to_account_id.in_(account_ids)
            )
            .group_by(AccountTransfer.to_account_id)
            .all()
        )

    account_report = []

    for account in accounts:
        balance = (
            Decimal(str(account.opening_balance or 0))
            + Decimal(str(income_by_account.get(account.id, 0)))
            - Decimal(str(expenses_by_account.get(account.id, 0)))
            - Decimal(str(outgoing_transfers.get(account.id, 0)))
            + Decimal(str(incoming_transfers.get(account.id, 0)))
        )

        account_report.append({
            "account_id": account.id,
            "account_name": account.account_name,
            "account_type": account.account_type,
            "currency": account.currency,
            "balance": money(balance)
        })

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        },
        "summary": {
            "total_income": money(total_income),
            "total_expenses": money(total_expenses),
            "net_savings": money(total_income - total_expenses),
            "total_transactions": len(transactions)
        },
        "monthly_report": monthly_report,
        "category_report": category_report,
        "account_report": account_report,
        "transactions": transaction_rows
    }
