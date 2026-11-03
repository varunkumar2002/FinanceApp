from datetime import date
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict

InvestmentCategory = Literal[
    "stocks",
    "mutual_funds",
    "etfs",
    "gold",
    "fixed_deposits",
    "bonds",
    "crypto",
    "other",
]

InvestmentMode = Literal["lumpsum", "sip"]


class InvestmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    symbol: Optional[str] = None
    category: InvestmentCategory
    investment_mode: InvestmentMode = "lumpsum"
    initial_invested_amount: Decimal = Field(default=Decimal("0"), ge=0)
    monthly_sip_amount: Decimal = Field(default=Decimal("0"), ge=0)
    sip_deduction_date: Optional[int] = Field(default=None, ge=1, le=31)
    primary_account_id: Optional[int] = None
    current_price: Decimal = Field(default=Decimal("0"), ge=0)
    notes: Optional[str] = None


class InvestmentUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    symbol: Optional[str] = None
    category: InvestmentCategory
    investment_mode: InvestmentMode = "lumpsum"
    initial_invested_amount: Decimal = Field(default=Decimal("0"), ge=0)
    monthly_sip_amount: Decimal = Field(default=Decimal("0"), ge=0)
    sip_deduction_date: Optional[int] = Field(default=None, ge=1, le=31)
    primary_account_id: Optional[int] = None
    current_price: Decimal = Field(ge=0)
    price_updated_at: Optional[date] = None
    notes: Optional[str] = None


class InvestmentTransactionCreate(BaseModel):
    transaction_type: Literal["buy", "sell", "dividend", "sip_deduction"]
    quantity: Decimal = Field(default=Decimal("0"), ge=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    amount: Decimal = Field(gt=0)
    transaction_date: date
    notes: Optional[str] = None


class InvestmentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    investment_id: int
    transaction_type: str
    quantity: Decimal
    unit_price: Decimal
    amount: Decimal
    transaction_date: date
    notes: Optional[str] = None


class InvestmentResponse(BaseModel):
    id: int
    name: str
    symbol: Optional[str]
    category: str
    investment_mode: str
    initial_invested_amount: Decimal
    monthly_sip_amount: Decimal
    sip_deduction_date: Optional[int]
    primary_account_id: Optional[int]
    current_price: Decimal
    price_updated_at: Optional[date]
    notes: Optional[str]

    quantity_held: Decimal
    total_invested: Decimal
    total_sold: Decimal
    dividends_received: Decimal
    current_value: Decimal
    profit_loss: Decimal
    return_percentage: Decimal

    model_config = ConfigDict(from_attributes=True)


class InvestmentSummaryResponse(BaseModel):
    total_invested: Decimal
    current_value: Decimal
    total_profit_loss: Decimal
    return_percentage: Decimal
    dividends_received: Decimal
    total_investments: int
    category_breakdown: list[dict]