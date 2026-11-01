from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.investment import Investment, InvestmentTransaction


ZERO = Decimal("0.00")
FOUR_PLACES = Decimal("0.0001")
TWO_PLACES = Decimal("0.01")

DEV_USER_ID = 1


def money(value):
    return Decimal(str(value or 0)).quantize(
        TWO_PLACES,
        rounding=ROUND_HALF_UP,
    )


def quantity_value(value):
    return Decimal(str(value or 0)).quantize(
        FOUR_PLACES,
        rounding=ROUND_HALF_UP,
    )


def get_investment(db: Session, investment_id: int):
    investment = (
        db.query(Investment)
        .filter(
            Investment.id == investment_id,
            Investment.user_id == DEV_USER_ID,
        )
        .first()
    )

    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    return investment


def calculate_investment(investment: Investment):
    transactions = investment.transactions

    bought_quantity = ZERO
    sold_quantity = ZERO
    total_bought = ZERO
    total_sold = ZERO
    dividends = ZERO

    for transaction in transactions:
        amount = money(transaction.amount)
        quantity = quantity_value(transaction.quantity)

        if transaction.transaction_type == "buy":
            bought_quantity += quantity
            total_bought += amount

        elif transaction.transaction_type == "sell":
            sold_quantity += quantity
            total_sold += amount

        elif transaction.transaction_type == "dividend":
            dividends += amount

    quantity_held = quantity_value(bought_quantity - sold_quantity)

    if quantity_held < 0:
        quantity_held = ZERO

    # Average purchase cost of units bought.
    average_cost = (
        total_bought / bought_quantity
        if bought_quantity > 0
        else ZERO
    )

    # Cost basis of the units still held.
    remaining_cost = money(average_cost * quantity_held)

    current_value = money(
        quantity_held * money(investment.current_price)
    )

    # Realised profit/loss from sales, using average cost.
    realised_profit_loss = money(
        total_sold - money(average_cost * sold_quantity)
    )

    # Unrealised profit/loss on units still held.
    unrealised_profit_loss = money(current_value - remaining_cost)

    profit_loss = money(
        realised_profit_loss + unrealised_profit_loss + dividends
    )

    # Net capital invested after sales.
    net_invested = money(total_bought - money(average_cost * sold_quantity))

    return {
        "quantity_held": quantity_held,
        "total_invested": net_invested,
        "total_sold": money(total_sold),
        "dividends_received": money(dividends),
        "current_value": current_value,
        "profit_loss": profit_loss,
        "return_percentage": (
            money((profit_loss / net_invested) * 100)
            if net_invested > 0
            else ZERO
        ),
    }


def investment_response(investment: Investment):
    calculated = calculate_investment(investment)

    return {
        "id": investment.id,
        "name": investment.name,
        "symbol": investment.symbol,
        "category": investment.category,
        "current_price": money(investment.current_price),
        "price_updated_at": investment.price_updated_at,
        "notes": investment.notes,
        **calculated,
    }


def list_investments(db: Session):
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == DEV_USER_ID)
        .order_by(Investment.created_at.desc())
        .all()
    )

    return [investment_response(item) for item in investments]


def create_investment(db: Session, data):
    investment = Investment(
        user_id=DEV_USER_ID,
        name=data.name,
        symbol=data.symbol,
        category=data.category,
        current_price=data.current_price,
        notes=data.notes,
    )

    db.add(investment)
    db.commit()
    db.refresh(investment)

    return investment_response(investment)


def update_investment(db: Session, investment_id: int, data):
    investment = get_investment(db, investment_id)

    investment.name = data.name
    investment.symbol = data.symbol
    investment.category = data.category
    investment.current_price = data.current_price
    investment.price_updated_at = data.price_updated_at
    investment.notes = data.notes

    db.commit()
    db.refresh(investment)

    return investment_response(investment)


def delete_investment(db: Session, investment_id: int):
    investment = get_investment(db, investment_id)

    db.delete(investment)
    db.commit()

    return {"message": "Investment deleted successfully"}


def add_transaction(
    db: Session,
    investment_id: int,
    data,
):
    investment = get_investment(db, investment_id)

    if data.transaction_type in ("buy", "sell"):
        if data.quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero",
            )

        if data.unit_price <= 0:
            raise HTTPException(
                status_code=400,
                detail="Unit price must be greater than zero",
            )

        expected_amount = money(data.quantity * data.unit_price)

        if abs(expected_amount - money(data.amount)) > TWO_PLACES:
            raise HTTPException(
                status_code=400,
                detail="Amount must equal quantity multiplied by unit price",
            )

    if data.transaction_type == "dividend":
        if data.quantity != 0:
            raise HTTPException(
                status_code=400,
                detail="Dividend transactions must have zero quantity",
            )

    if data.transaction_type == "sell":
        current = calculate_investment(investment)

        if data.quantity > current["quantity_held"]:
            raise HTTPException(
                status_code=400,
                detail="You cannot sell more units than you currently hold",
            )

    transaction = InvestmentTransaction(
        investment_id=investment_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        unit_price=data.unit_price,
        amount=data.amount,
        transaction_date=data.transaction_date,
        notes=data.notes,
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction


def get_transactions(db: Session, investment_id: int):
    get_investment(db, investment_id)

    return (
        db.query(InvestmentTransaction)
        .filter(InvestmentTransaction.investment_id == investment_id)
        .order_by(
            InvestmentTransaction.transaction_date.desc(),
            InvestmentTransaction.id.desc(),
        )
        .all()
    )


def get_summary(db: Session):
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == DEV_USER_ID)
        .all()
    )

    total_invested = ZERO
    current_value = ZERO
    total_profit_loss = ZERO
    dividends = ZERO
    category_totals = {}

    for investment in investments:
        details = calculate_investment(investment)

        total_invested += details["total_invested"]
        current_value += details["current_value"]
        total_profit_loss += details["profit_loss"]
        dividends += details["dividends_received"]

        category = investment.category

        if category not in category_totals:
            category_totals[category] = ZERO

        category_totals[category] += details["current_value"]

    total_invested = money(total_invested)
    current_value = money(current_value)
    total_profit_loss = money(total_profit_loss)

    return {
        "total_invested": total_invested,
        "current_value": current_value,
        "total_profit_loss": total_profit_loss,
        "return_percentage": (
            money((total_profit_loss / total_invested) * 100)
            if total_invested > 0
            else ZERO
        ),
        "dividends_received": money(dividends),
        "total_investments": len(investments),
        "category_breakdown": [
            {
                "category": category,
                "current_value": money(value),
            }
            for category, value in category_totals.items()
        ],
    }