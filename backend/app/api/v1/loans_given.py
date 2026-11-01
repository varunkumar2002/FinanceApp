# loans_given.py
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.loan_given import (
    LoanGivenCreate,
    LoanGivenUpdate,
    LoanGivenResponse,
    LoanGivenDetailResponse,
    LoanGivenSummaryResponse,
    LoanPaymentCreate,
    LoanPaymentResponse,
)

from app.services import loan_given_service


router = APIRouter(
    prefix="/loans-given",
    tags=["Loans Given"],
)

# Temporary development user.
# Replace this with the authenticated user's ID when authentication
# is implemented.
DEV_USER_ID = 1


# ---------------------------------------------------------
# LOAN SUMMARY
# ---------------------------------------------------------

@router.get(
    "/summary",
    response_model=LoanGivenSummaryResponse,
)
def loan_summary(db: Session = Depends(get_db)):
    return loan_given_service.get_loan_summary(
        db,
        DEV_USER_ID,
    )


# ---------------------------------------------------------
# GENERATE MONTHLY INTEREST
# ---------------------------------------------------------

@router.post("/generate-interest")
def generate_interest(
    as_of_date: date | None = None,
    db: Session = Depends(get_db),
):
    try:
        return loan_given_service.generate_monthly_interest(
            db,
            DEV_USER_ID,
            as_of_date,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ---------------------------------------------------------
# LIST ALL LOANS
# ---------------------------------------------------------

@router.get("/", response_model=list[LoanGivenResponse])
def list_loans(db: Session = Depends(get_db)):
    return loan_given_service.get_all_loans(
        db,
        DEV_USER_ID,
    )


# ---------------------------------------------------------
# CREATE LOAN
# ---------------------------------------------------------

@router.post(
    "/",
    response_model=LoanGivenResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_loan(
    loan_data: LoanGivenCreate,
    db: Session = Depends(get_db),
):
    try:
        return loan_given_service.create_loan(
            db,
            DEV_USER_ID,
            loan_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ---------------------------------------------------------
# GET LOAN DETAILS
# ---------------------------------------------------------

@router.get(
    "/{loan_id}",
    response_model=LoanGivenDetailResponse,
)
def get_loan_details(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_given_service.get_loan_by_id(
        db,
        DEV_USER_ID,
        loan_id,
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_given_service.get_loan_details(
        db,
        loan,
    )


# ---------------------------------------------------------
# UPDATE LOAN
# ---------------------------------------------------------

@router.put(
    "/{loan_id}",
    response_model=LoanGivenResponse,
)
def update_existing_loan(
    loan_id: int,
    loan_data: LoanGivenUpdate,
    db: Session = Depends(get_db),
):
    loan = loan_given_service.get_loan_by_id(
        db,
        DEV_USER_ID,
        loan_id,
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    try:
        return loan_given_service.update_loan(
            db,
            loan,
            loan_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ---------------------------------------------------------
# RECORD PAYMENT
# ---------------------------------------------------------

@router.post(
    "/{loan_id}/payments",
    response_model=LoanPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_loan_payment(
    loan_id: int,
    payment_data: LoanPaymentCreate,
    db: Session = Depends(get_db),
):
    loan = loan_given_service.get_loan_by_id(
        db,
        DEV_USER_ID,
        loan_id,
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    try:
        return loan_given_service.record_loan_payment(
            db,
            loan,
            payment_data,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ---------------------------------------------------------
# LIST LOAN INTEREST RECORDS
# ---------------------------------------------------------

@router.get("/{loan_id}/interests")
def list_loan_interests(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_given_service.get_loan_by_id(
        db,
        DEV_USER_ID,
        loan_id,
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_given_service.get_loan_interests(
        db,
        loan.id,
    )


# ---------------------------------------------------------
# LIST LOAN PAYMENTS
# ---------------------------------------------------------

@router.get("/{loan_id}/payments")
def list_loan_payments(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_given_service.get_loan_by_id(
        db,
        DEV_USER_ID,
        loan_id,
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_given_service.get_loan_payments(
        db,
        loan.id,
    )
