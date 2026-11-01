from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.user_preference import UserPreference

from app.schemas.settings import (
    ProfileResponse,
    ProfileUpdate,
    PreferencesResponse,
    PreferencesUpdate,
    RemindersResponse,
    RemindersUpdate,
    SettingsResponse
)

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

# Temporary user ID, matching the existing development setup.
DEV_USER_ID = 1


def get_or_create_preferences(db: Session, user_id: int):
    preferences = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == user_id)
        .first()
    )

    if not preferences:
        preferences = UserPreference(user_id=user_id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == DEV_USER_ID).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    preferences = get_or_create_preferences(db, DEV_USER_ID)

    return {
        "profile": user,
        "preferences": preferences,
        "reminders": preferences
    }


@router.put("/profile", response_model=ProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == DEV_USER_ID).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_email = (
        db.query(User)
        .filter(
            User.email == data.email,
            User.id != DEV_USER_ID
        )
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="This email address is already in use"
        )

    user.full_name = data.full_name.strip()
    user.email = data.email

    db.commit()
    db.refresh(user)

    return user


@router.put("/preferences", response_model=PreferencesResponse)
def update_preferences(
    data: PreferencesUpdate,
    db: Session = Depends(get_db)
):
    preferences = get_or_create_preferences(db, DEV_USER_ID)

    preferences.currency = data.currency
    preferences.date_format = data.date_format
    preferences.theme = data.theme

    db.commit()
    db.refresh(preferences)

    return preferences


@router.put("/reminders", response_model=RemindersResponse)
def update_reminders(
    data: RemindersUpdate,
    db: Session = Depends(get_db)
):
    preferences = get_or_create_preferences(db, DEV_USER_ID)

    preferences.loan_reminders = data.loan_reminders
    preferences.chit_fund_reminders = data.chit_fund_reminders
    preferences.payment_reminders = data.payment_reminders
    preferences.reminder_days_before = data.reminder_days_before

    db.commit()
    db.refresh(preferences)

    return preferences