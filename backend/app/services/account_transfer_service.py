from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.account_transfer import AccountTransfer
from app.schemas.account_transfer import AccountTransferCreate
from app.services.account_service import get_account_balance_map


def get_transfers(
    db: Session,
    user_id: int
):
    transfers = (
        db.query(AccountTransfer)
        .filter(AccountTransfer.user_id == user_id)
        .order_by(
            AccountTransfer.transfer_date.desc(),
            AccountTransfer.id.desc()
        )
        .all()
    )

    account_ids = set()

    for transfer in transfers:
        account_ids.add(transfer.from_account_id)
        account_ids.add(transfer.to_account_id)

    accounts = (
        db.query(Account)
        .filter(
            Account.user_id == user_id,
            Account.id.in_(account_ids)
        )
        .all()
    ) if account_ids else []

    account_names = {
        account.id: account.account_name
        for account in accounts
    }

    return [
        {
            "id": transfer.id,
            "user_id": transfer.user_id,
            "from_account_id": transfer.from_account_id,
            "to_account_id": transfer.to_account_id,
            "from_account_name": account_names.get(
                transfer.from_account_id,
                "Unknown account"
            ),
            "to_account_name": account_names.get(
                transfer.to_account_id,
                "Unknown account"
            ),
            "amount": transfer.amount,
            "transfer_date": transfer.transfer_date,
            "notes": transfer.notes
        }
        for transfer in transfers
    ]


def create_transfer(
    db: Session,
    user_id: int,
    data: AccountTransferCreate
):
    if data.from_account_id == data.to_account_id:
        raise ValueError(
            "Source and destination accounts must be different"
        )

    # Lock both account rows while validating and recording the transfer.
    account_ids = sorted([
        data.from_account_id,
        data.to_account_id
    ])

    accounts = (
        db.query(Account)
        .filter(
            Account.id.in_(account_ids),
            Account.user_id == user_id
        )
        .order_by(Account.id)
        .with_for_update()
        .all()
    )

    account_map = {
        account.id: account
        for account in accounts
    }

    source = account_map.get(data.from_account_id)
    destination = account_map.get(data.to_account_id)

    if not source or not destination:
        raise ValueError(
            "One or both selected accounts were not found"
        )

    if not source.is_active or not destination.is_active:
        raise ValueError(
            "Both accounts must be active"
        )

    if source.currency != destination.currency:
        raise ValueError(
            "Transfers between different currencies are not supported"
        )

    balance_map = get_account_balance_map(db, user_id)

    source_balance = balance_map.get(
        source.id,
        source.opening_balance
    )

    if data.amount > source_balance:
        raise ValueError(
            f"Insufficient balance. Available balance: "
            f"{source.currency} {source_balance}"
        )

    transfer = AccountTransfer(
        user_id=user_id,
        from_account_id=data.from_account_id,
        to_account_id=data.to_account_id,
        amount=data.amount,
        transfer_date=data.transfer_date,
        notes=data.notes
    )

    try:
        db.add(transfer)
        db.commit()
        db.refresh(transfer)

        return {
            "id": transfer.id,
            "user_id": transfer.user_id,
            "from_account_id": transfer.from_account_id,
            "to_account_id": transfer.to_account_id,
            "from_account_name": source.account_name,
            "to_account_name": destination.account_name,
            "amount": transfer.amount,
            "transfer_date": transfer.transfer_date,
            "notes": transfer.notes
        }

    except Exception:
        db.rollback()
        raise