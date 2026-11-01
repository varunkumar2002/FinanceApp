# transaction_service.py
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate


def get_transactions(
    db: Session,
    user_id: int,
    transaction_type: str | None = None,
    account_id: int | None = None,
    category_id: int | None = None
):
    query = db.query(Transaction).filter(
        Transaction.user_id == user_id
    )

    if transaction_type:
        query = query.filter(
            Transaction.transaction_type == transaction_type
        )

    if account_id:
        query = query.filter(
            Transaction.account_id == account_id
        )

    if category_id:
        query = query.filter(
            Transaction.category_id == category_id
        )

    return query.order_by(
        Transaction.transaction_date.desc(),
        Transaction.id.desc()
    ).all()


def get_transaction_by_id(db: Session, user_id: int, transaction_id: int):
    return db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == user_id
    ).first()


def validate_transaction_references(
    db: Session,
    user_id: int,
    account_id: int,
    category_id: int,
    transaction_type: str
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == user_id,
        Account.is_active == True
    ).first()

    if not account:
        raise ValueError("Selected account was not found or is inactive")

    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user_id
    ).first()

    if not category:
        raise ValueError("Selected category was not found")

    if category.category_type != transaction_type:
        raise ValueError(
            "Category type must match the transaction type"
        )


def create_transaction(
    db: Session,
    user_id: int,
    data: TransactionCreate
):
    validate_transaction_references(
        db,
        user_id,
        data.account_id,
        data.category_id,
        data.transaction_type
    )

    transaction = Transaction(
        user_id=user_id,
        **data.model_dump()
    )

    try:
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        return transaction
    except Exception:
        db.rollback()
        raise


def update_transaction(
    db: Session,
    transaction: Transaction,
    data: TransactionUpdate,
    user_id: int
):
    update_data = data.model_dump(exclude_unset=True)

    # Validate the final combination of account, category and type.
    account_id = update_data.get("account_id", transaction.account_id)
    category_id = update_data.get("category_id", transaction.category_id)
    transaction_type = update_data.get(
        "transaction_type", transaction.transaction_type
    )

    validate_transaction_references(
        db,
        user_id,
        account_id,
        category_id,
        transaction_type
    )

    try:
        for field, value in update_data.items():
            setattr(transaction, field, value)

        db.commit()
        db.refresh(transaction)
        return transaction
    except Exception:
        db.rollback()
        raise


def delete_transaction(db: Session, transaction: Transaction):
    try:
        db.delete(transaction)
        db.commit()
    except Exception:
        db.rollback()
        raise