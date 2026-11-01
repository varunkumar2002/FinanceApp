
from datetime import date
from decimal import Decimal
from calendar import monthrange

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.chit_fund import (
    ChitFund,
    ChitInstallment,
    ChitPayment,
)


ZERO = Decimal("0.00")


def add_months(d, months, due_day=None):
    month_index = d.month - 1 + months

    year = d.year + month_index // 12
    month = month_index % 12 + 1

    day = min(
        due_day or d.day,
        monthrange(year, month)[1]
    )

    return date(year, month, day)


def get_installment_details(db: Session, installment):

    paid = (
        db.query(func.coalesce(func.sum(ChitPayment.amount), 0))
        .filter(
            ChitPayment.installment_id == installment.id,
            ChitPayment.payment_type == "contribution"
        )
        .scalar()
        or ZERO
    )

    paid = Decimal(str(paid))

    outstanding = max(
        Decimal(installment.contribution_amount) - paid,
        ZERO
    )

    if outstanding == 0:
        status = "paid"
    elif paid > 0:
        status = "partial"
    else:
        status = "pending"

    return {
        "id": installment.id,
        "installment_number": installment.installment_number,
        "due_date": installment.due_date,

        "contribution_amount": installment.contribution_amount,
        "amount_paid": paid,
        "outstanding_amount": outstanding,

        "status": status,

        "auction_date": installment.auction_date,
        "bid_amount": installment.bid_amount,
        "dividend_amount": installment.dividend_amount,

        "prize_amount": installment.prize_amount,
        "prize_received": installment.prize_received,

        "notes": installment.notes,
    }


def get_fund_details(db: Session, fund, include_installments=True):

    installments = (
        db.query(ChitInstallment)
        .filter_by(chit_fund_id=fund.id)
        .order_by(ChitInstallment.installment_number)
        .all()
    )

    installment_details = [
        get_installment_details(db, item)
        for item in installments
    ]

    total_contributed = sum(
        (item["amount_paid"] for item in installment_details),
        ZERO
    )

    outstanding = sum(
        (item["outstanding_amount"] for item in installment_details),
        ZERO
    )

    prize_received = (
        db.query(func.coalesce(func.sum(ChitPayment.amount), 0))
        .filter(
            ChitPayment.chit_fund_id == fund.id,
            ChitPayment.payment_type == "prize_received"
        )
        .scalar()
        or ZERO
    )

    return {
        "id": fund.id,

        "name": fund.name,
        "organizer_name": fund.organizer_name,
        "organizer_phone": fund.organizer_phone,

        "chit_value": fund.chit_value,
        "monthly_contribution": fund.monthly_contribution,
        "total_installments": fund.total_installments,

        "start_date": fund.start_date,
        "due_day": fund.due_day,

        "status": fund.status,
        "notes": fund.notes,

        "total_contributed": total_contributed,
        "outstanding_contributions": outstanding,

        "total_prize_received": Decimal(str(prize_received)),

        "installments_paid": sum(
            1 for item in installment_details
            if item["status"] == "paid"
        ),

        "installments": (
            installment_details
            if include_installments
            else []
        ),
    }


def get_fund(db: Session, user_id: int, fund_id: int):

    fund = (
        db.query(ChitFund)
        .filter_by(
            id=fund_id,
            user_id=user_id
        )
        .first()
    )

    if not fund:
        raise HTTPException(
            status_code=404,
            detail="Chit fund not found"
        )

    return fund


def list_funds(db: Session, user_id: int):

    funds = (
        db.query(ChitFund)
        .filter_by(user_id=user_id)
        .order_by(ChitFund.created_at.desc())
        .all()
    )

    return [
        get_fund_details(db, fund)
        for fund in funds
    ]


def create_fund(db: Session, user_id: int, data):

    fund = ChitFund(
        user_id=user_id,
        **data.model_dump()
    )

    db.add(fund)
    db.flush()

    # Automatically generate all monthly installments.
    for number in range(1, fund.total_installments + 1):

        due_date = add_months(
            fund.start_date,
            number - 1,
            fund.due_day
        )

        installment = ChitInstallment(
            chit_fund_id=fund.id,
            installment_number=number,
            due_date=due_date,
            contribution_amount=fund.monthly_contribution
        )

        db.add(installment)

    db.commit()
    db.refresh(fund)

    return get_fund_details(db, fund)


def update_fund(db: Session, user_id: int, fund_id: int, data):

    fund = get_fund(db, user_id, fund_id)

    values = data.model_dump()

    for key, value in values.items():
        setattr(fund, key, value)

    db.commit()
    db.refresh(fund)

    return get_fund_details(db, fund)


def update_installment(
    db: Session,
    user_id: int,
    fund_id: int,
    installment_id: int,
    data
):

    get_fund(db, user_id, fund_id)

    installment = (
        db.query(ChitInstallment)
        .filter_by(
            id=installment_id,
            chit_fund_id=fund_id
        )
        .first()
    )

    if not installment:
        raise HTTPException(
            status_code=404,
            detail="Installment not found"
        )

    for key, value in data.model_dump().items():
        setattr(installment, key, value)

    db.commit()
    db.refresh(installment)

    return get_installment_details(db, installment)


def add_payment(db: Session, user_id: int, fund_id: int, data):

    get_fund(db, user_id, fund_id)

    installment = None

    if data.installment_id:
        installment = (
            db.query(ChitInstallment)
            .filter_by(
                id=data.installment_id,
                chit_fund_id=fund_id
            )
            .first()
        )

        if not installment:
            raise HTTPException(
                status_code=404,
                detail="Installment not found"
            )

    if not installment:
        raise HTTPException(
            status_code=400,
            detail="Select an installment for this payment"
        )

    if data.payment_type == "contribution":

        paid = (
            db.query(func.coalesce(func.sum(ChitPayment.amount), 0))
            .filter(
                ChitPayment.installment_id == installment.id,
                ChitPayment.payment_type == "contribution"
            )
            .scalar()
            or ZERO
        )

        if Decimal(str(paid)) + data.amount > Decimal(
            installment.contribution_amount
        ):
            raise HTTPException(
                status_code=400,
                detail="Payment exceeds the installment outstanding amount"
            )

    payment = ChitPayment(
        chit_fund_id=fund_id,
        **data.model_dump()
    )

    db.add(payment)

    if data.payment_type == "prize_received":
        installment.prize_received = True

    db.commit()
    db.refresh(payment)

    return payment


def get_payments(db: Session, user_id: int, fund_id: int):

    get_fund(db, user_id, fund_id)

    return (
        db.query(ChitPayment)
        .filter_by(chit_fund_id=fund_id)
        .order_by(
            ChitPayment.payment_date.desc(),
            ChitPayment.id.desc()
        )
        .all()
    )


def get_summary(db: Session, user_id: int):

    funds = (
        db.query(ChitFund)
        .filter_by(user_id=user_id)
        .all()
    )

    details = [
        get_fund_details(db, fund, include_installments=False)
        for fund in funds
    ]

    return {
        "total_chit_value": sum(
            (Decimal(str(fund.chit_value)) for fund in funds),
            ZERO
        ),

        "monthly_commitment": sum(
            (
                Decimal(str(fund.monthly_contribution))
                for fund in funds
                if fund.status == "active"
            ),
            ZERO
        ),

        "total_contributed": sum(
            (item["total_contributed"] for item in details),
            ZERO
        ),

        "outstanding_contributions": sum(
            (item["outstanding_contributions"] for item in details),
            ZERO
        ),

        "total_prize_received": sum(
            (item["total_prize_received"] for item in details),
            ZERO
        ),

        "active_funds": sum(
            1 for fund in funds
            if fund.status == "active"
        ),

        "total_funds": len(funds),
    }
