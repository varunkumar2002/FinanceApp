# loans_taken.py
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.schemas.loan_taken import (
    LoanTakenCreate,
    LoanTakenUpdate,
    LoanTakenResponse,
    LoanTakenDetailResponse,
    LoanTakenSummaryResponse,
    LoanPaymentCreate,
    LoanTakenPaymentResponse,
)

from app.services import loan_taken_service


router = APIRouter(
    prefix="/loans-taken",
    tags=["Loans Taken"],
)

DEV_USER_ID = 1


@router.get(
    "/summary",
    response_model=LoanTakenSummaryResponse,
)
def loan_summary(db: Session = Depends(get_db)):
    return loan_taken_service.get_loan_summary(db, DEV_USER_ID)


@router.post("/generate-interest")
def generate_interest(
    as_of_date: date | None = None,
    db: Session = Depends(get_db),
):
    try:
        return loan_taken_service.generate_monthly_interest(
            db, DEV_USER_ID, as_of_date
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get("/", response_model=list[LoanTakenResponse])
def list_loans(db: Session = Depends(get_db)):
    return loan_taken_service.get_all_loans(db, DEV_USER_ID)


@router.post(
    "/",
    response_model=LoanTakenResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_loan(
    loan_data: LoanTakenCreate,
    db: Session = Depends(get_db),
):
    try:
        return loan_taken_service.create_loan(
            db, DEV_USER_ID, loan_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get(
    "/{loan_id}",
    response_model=LoanTakenDetailResponse,
)
def get_loan_details(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_taken_service.get_loan_by_id(
        db, DEV_USER_ID, loan_id
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_taken_service.get_loan_details(db, loan)


@router.put(
    "/{loan_id}",
    response_model=LoanTakenResponse,
)
def update_existing_loan(
    loan_id: int,
    loan_data: LoanTakenUpdate,
    db: Session = Depends(get_db),
):
    loan = loan_taken_service.get_loan_by_id(
        db, DEV_USER_ID, loan_id
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    try:
        return loan_taken_service.update_loan(
            db, loan, loan_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.post(
    "/{loan_id}/payments",
    response_model=LoanTakenPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_loan_payment(
    loan_id: int,
    payment_data: LoanPaymentCreate,
    db: Session = Depends(get_db),
):
    loan = loan_taken_service.get_loan_by_id(
        db, DEV_USER_ID, loan_id
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    try:
        return loan_taken_service.record_loan_payment(
            db, loan, payment_data
        )
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


@router.get("/{loan_id}/interests")
def list_loan_interests(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_taken_service.get_loan_by_id(
        db, DEV_USER_ID, loan_id
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_taken_service.get_loan_interests(db, loan.id)


@router.get("/{loan_id}/payments")
def list_loan_payments(
    loan_id: int,
    db: Session = Depends(get_db),
):
    loan = loan_taken_service.get_loan_by_id(
        db, DEV_USER_ID, loan_id
    )

    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found",
        )

    return loan_taken_service.get_loan_payments(db, loan.id)