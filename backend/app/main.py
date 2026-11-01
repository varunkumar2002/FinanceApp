from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.api.v1.accounts import router as accounts_router
from app.api.v1.dashboard import router as dashboard_router
from app.core.config import settings
from app.database.connection import engine
from app.api.v1.transactions import router as transactions_router
from app.api.v1.loans_given import router as loans_given_router
# Register database models
from app import models
from app.api.v1.loans_taken import router as loans_taken_router
from app.schemas.health import HealthResponse
from app.api.v1.chit_funds import router as chit_funds_router
from app.api.v1.investments import router as investments_router
from app.api.v1.transfers import router as transfers_router
from app.api.v1.reports import router as reports_router
from app.api.v1.settings import router as settings_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Personal Financial Management Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(accounts_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(loans_given_router, prefix="/api/v1")
app.include_router(loans_taken_router, prefix="/api/v1")
app.include_router(chit_funds_router, prefix="/api/v1")
app.include_router(investments_router, prefix="/api/v1")
app.include_router(transfers_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")

@app.get("/")
def home():

    return {
        "message": "Welcome to MyFinance",
        "version": "1.0.0"
    }


@app.get("/api/v1/health", response_model=HealthResponse)
def health_check():

    database_status = "connected"

    try:

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

    except Exception:

        database_status = "disconnected"

    return {
        "status": "running",
        "application": settings.APP_NAME,
        "database": database_status
    }