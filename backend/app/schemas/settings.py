from pydantic import BaseModel, EmailStr, Field
from typing import Literal


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr


class PreferencesResponse(BaseModel):
    currency: str
    date_format: str
    theme: str

    model_config = {
        "from_attributes": True
    }


class PreferencesUpdate(BaseModel):
    currency: Literal["INR", "USD", "EUR", "GBP", "AED"]
    date_format: Literal["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]
    theme: Literal["light", "dark", "system"]


class RemindersResponse(BaseModel):
    loan_reminders: bool
    chit_fund_reminders: bool
    payment_reminders: bool
    reminder_days_before: int

    model_config = {
        "from_attributes": True
    }


class RemindersUpdate(BaseModel):
    loan_reminders: bool
    chit_fund_reminders: bool
    payment_reminders: bool
    reminder_days_before: int = Field(ge=0, le=30)


class SettingsResponse(BaseModel):
    profile: ProfileResponse
    preferences: PreferencesResponse
    reminders: RemindersResponse