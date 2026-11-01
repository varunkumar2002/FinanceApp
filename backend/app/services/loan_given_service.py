# loan_given_service.py
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.orm import Session

from app.models.loan_given import LoanGiven
from app.models.loan_interest import LoanInterest
from app.models.loan_given_payment import LoanGivenPayment

from app.schemas.loan_given import (
    LoanGivenCreate,
    LoanGivenUpdate,
    LoanPaymentCreate,
)


ZERO = Decimal("0.00")
CENT = Decimal("0.01")


def round_money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def add_months(original_date: date, months: int) -> date:
    """
    Add calendar months while preserving the day where possible.

    Example:
    January 31 + 1 month = February 28 (or 29 in a leap year).
    """
    import calendar

    month_index = original_date.month - 1 + months
    year = original_date.year + month_index // 12
    month = month_index % 12 + 1

    last_day = calendar.monthrange(year, month)[1]
    day = min(original_date.day, last_day)

    return date(year, month, day)


# ---------------------------------------------------------
# LOAN MANAGEMENT
# ---------------------------------------------------------

def get_all_loans(db: Session, user_id: int):
    return (
        db.query(LoanGiven)
        .filter(LoanGiven.user_id == user_id)
        .order_by(LoanGiven.created_at.desc())
        .all()
    )


def get_loan_by_id(db: Session, user_id: int, loan_id: int):
    return (
        db.query(LoanGiven)
        .filter(
            LoanGiven.id == loan_id,
            LoanGiven.user_id == user_id,
        )
        .first()
    )


def create_loan(
    db: Session,
    user_id: int,
    data: LoanGivenCreate,
):
    if data.due_date and data.due_date < data.start_date:
        raise ValueError("Due date cannot be before the loan start date")

    loan = LoanGiven(
        user_id=user_id,
        borrower_name=data.borrower_name,
        borrower_phone=data.borrower_phone,
        principal_amount=data.principal_amount,
        outstanding_principal=data.principal_amount,
        monthly_interest_rate=data.monthly_interest_rate,
        start_date=data.start_date,
        due_date=data.due_date,
        notes=data.notes,
        is_active=True,
    )

    try:
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan
    except Exception:
        db.rollback()
        raise



def update_loan(
    db: Session,
    loan: LoanGiven,
    data: LoanGivenUpdate,
):
    update_data = data.model_dump(exclude_unset=True)

    # Check whether financial history already exists.
    has_payments = (
        db.query(LoanGivenPayment)
        .filter(LoanGivenPayment.loan_id == loan.id)
        .first()
        is not None
    )

    has_interest_records = (
        db.query(LoanInterest)
        .filter(LoanInterest.loan_id == loan.id)
        .first()
        is not None
    )

    # Original principal and start date can only be changed
    # before payments or interest records have been created.
    protected_fields = {"principal_amount", "start_date"}

    if (
        protected_fields.intersection(update_data.keys())
        and (has_payments or has_interest_records)
    ):
        raise ValueError(
            "Principal amount and start date cannot be changed "
            "after payments or interest records exist. "
            "Other loan details can still be edited."
        )

    # Determine the effective dates before updating.
    new_start_date = update_data.get(
        "start_date",
        loan.start_date,
    )

    new_due_date = update_data.get(
        "due_date",
        loan.due_date,
    )

    if new_start_date is None:
        raise ValueError("Loan start date is required")

    if new_due_date and new_due_date < new_start_date:
        raise ValueError(
            "Due date cannot be before the loan start date"
        )

    try:
        for field, value in update_data.items():
            # Allow explicitly clearing optional fields.
            setattr(loan, field, value)

        # If the original principal is corrected before any
        # financial history exists, update outstanding principal too.
        if "principal_amount" in update_data:
            loan.outstanding_principal = update_data[
                "principal_amount"
            ]

        db.commit()
        db.refresh(loan)

        return loan

    except Exception:
        db.rollback()
        raise



# ---------------------------------------------------------
# INTEREST CALCULATION
# ---------------------------------------------------------

def generate_monthly_interest(
    db: Session,
    user_id: int,
    as_of_date: date | None = None,
):
    """
    Generate interest for all completed monthly periods.

    A period starts on the loan start date or its monthly
    anniversary. Interest is calculated on the principal
    outstanding at the beginning of that period.

    Principal payments dated on or before the period start
    are included when determining the principal basis.
    """

    as_of_date = as_of_date or date.today()

    loans = (
        db.query(LoanGiven)
        .filter(LoanGiven.user_id == user_id)
        .all()
    )

    generated_count = 0

    try:
        for loan in loans:
            existing_periods = {
                row.period_month
                for row in db.query(LoanInterest)
                .filter(LoanInterest.loan_id == loan.id)
                .all()
            }

            principal_payments = (
                db.query(LoanGivenPayment)
                .filter(
                    LoanGivenPayment.loan_id == loan.id,
                    LoanGivenPayment.payment_type == "principal",
                )
                .order_by(
                    LoanGivenPayment.payment_date.asc(),
                    LoanGivenPayment.id.asc(),
                )
                .all()
            )

            period_start = loan.start_date
            period_number = 0

            while True:
                period_start = add_months(
                    loan.start_date,
                    period_number,
                )

                period_due_date = add_months(
                    loan.start_date,
                    period_number + 1,
                )

                # Only generate interest for completed periods.
                if period_due_date > as_of_date:
                    break

                if period_start not in existing_periods:
                    principal_repaid_before_period = sum(
                        (
                            payment.amount
                            for payment in principal_payments
                            if payment.payment_date <= period_start
                        ),
                        start=ZERO,
                    )

                    principal_basis = max(
                        ZERO,
                        loan.principal_amount
                        - principal_repaid_before_period,
                    )

                    interest_amount = round_money(
                        principal_basis
                        * loan.monthly_interest_rate
                        / Decimal("100")
                    )

                    if interest_amount > ZERO:
                        interest = LoanInterest(
                            loan_id=loan.id,
                            period_month=period_start,
                            principal_basis=principal_basis,
                            interest_amount=interest_amount,
                            amount_paid=ZERO,
                            due_date=period_due_date,
                            status="pending",
                        )

                        db.add(interest)
                        generated_count += 1

                period_number += 1

        db.commit()

        return {
            "message": "Monthly interest generation completed",
            "generated_count": generated_count,
            "as_of_date": as_of_date,
        }

    except Exception:
        db.rollback()
        raise


# ---------------------------------------------------------
# PAYMENT MANAGEMENT
# ---------------------------------------------------------

def record_loan_payment(
    db: Session,
    loan: LoanGiven,
    data: LoanPaymentCreate,
):
    if data.payment_date < loan.start_date:
        raise ValueError("Payment date cannot be before the loan start date")

    if data.payment_type == "principal":
        if data.interest_id is not None:
            raise ValueError(
                "Principal payments must not contain an interest_id"
            )

        if data.amount > loan.outstanding_principal:
            raise ValueError(
                "Principal payment exceeds outstanding principal"
            )

        if data.amount <= ZERO:
            raise ValueError("Payment amount must be greater than zero")

    elif data.payment_type == "interest":
        if data.interest_id is None:
            raise ValueError(
                "An interest_id is required for interest payments"
            )

        interest = (
            db.query(LoanInterest)
            .filter(
                LoanInterest.id == data.interest_id,
                LoanInterest.loan_id == loan.id,
            )
            .first()
        )

        if not interest:
            raise ValueError("Interest record not found for this loan")

        remaining_interest = (
            interest.interest_amount - interest.amount_paid
        )

        if data.amount > remaining_interest:
            raise ValueError(
                "Payment exceeds the outstanding interest amount"
            )

    payment = LoanGivenPayment(
        loan_id=loan.id,
        interest_id=data.interest_id,
        payment_type=data.payment_type,
        amount=data.amount,
        payment_date=data.payment_date,
        notes=data.notes,
    )

    try:
        if data.payment_type == "principal":
            loan.outstanding_principal = round_money(
                loan.outstanding_principal - data.amount
            )

            if loan.outstanding_principal == ZERO:
                loan.is_active = False

        else:
            interest.amount_paid = round_money(
                interest.amount_paid + data.amount
            )

            if interest.amount_paid >= interest.interest_amount:
                interest.status = "paid"
            else:
                interest.status = "partially_paid"

        db.add(payment)
        db.commit()
        db.refresh(payment)

        return payment

    except Exception:
        db.rollback()
        raise


def get_loan_payments(db: Session, loan_id: int):
    return (
        db.query(LoanGivenPayment)
        .filter(LoanGivenPayment.loan_id == loan_id)
        .order_by(
            LoanGivenPayment.payment_date.desc(),
            LoanGivenPayment.id.desc(),
        )
        .all()
    )


def get_loan_interests(db: Session, loan_id: int):
    return (
        db.query(LoanInterest)
        .filter(LoanInterest.loan_id == loan_id)
        .order_by(LoanInterest.period_month.desc())
        .all()
    )


# ---------------------------------------------------------
# LOAN DETAILS
# ---------------------------------------------------------

def get_loan_details(db: Session, loan: LoanGiven):
    interests = get_loan_interests(db, loan.id)
    payments = get_loan_payments(db, loan.id)

    total_interest_generated = sum(
        (item.interest_amount for item in interests),
        start=ZERO,
    )

    total_interest_paid = sum(
        (item.amount_paid for item in interests),
        start=ZERO,
    )

    outstanding_interest = (
        total_interest_generated - total_interest_paid
    )

    return {
        "id": loan.id,
        "user_id": loan.user_id,
        "borrower_name": loan.borrower_name,
        "borrower_phone": loan.borrower_phone,
        "principal_amount": loan.principal_amount,
        "outstanding_principal": loan.outstanding_principal,
        "monthly_interest_rate": loan.monthly_interest_rate,
        "start_date": loan.start_date,
        "due_date": loan.due_date,
        "notes": loan.notes,
        "is_active": loan.is_active,
        "total_interest_generated": total_interest_generated,
        "total_interest_paid": total_interest_paid,
        "outstanding_interest": outstanding_interest,
        "interests": interests,
        "payments": payments,
    }


# ---------------------------------------------------------
# LOAN SUMMARY
# ---------------------------------------------------------

def get_loan_summary(db: Session, user_id: int):
    loans = get_all_loans(db, user_id)

    loan_ids = [loan.id for loan in loans]

    interests = []

    if loan_ids:
        interests = (
            db.query(LoanInterest)
            .filter(LoanInterest.loan_id.in_(loan_ids))
            .all()
        )

    total_principal_lent = sum(
        (loan.principal_amount for loan in loans),
        start=ZERO,
    )

    outstanding_principal = sum(
        (loan.outstanding_principal for loan in loans),
        start=ZERO,
    )

    total_interest_generated = sum(
        (item.interest_amount for item in interests),
        start=ZERO,
    )

    total_interest_received = sum(
        (item.amount_paid for item in interests),
        start=ZERO,
    )

    outstanding_interest = (
        total_interest_generated - total_interest_received
    )

    return {
        "total_loans": len(loans),
        "active_loans": sum(1 for loan in loans if loan.is_active),
        "closed_loans": sum(1 for loan in loans if not loan.is_active),
        "total_principal_lent": total_principal_lent,
        "outstanding_principal": outstanding_principal,
        "total_interest_generated": total_interest_generated,
        "total_interest_received": total_interest_received,
        "outstanding_interest": outstanding_interest,
    }
