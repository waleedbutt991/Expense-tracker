from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime

import database, models, auth

# Local Database Tables Create Karna
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Expense & Income Tracker API")

# CORS Middleware (Frontend Access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class UserAuth(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class IncomeCreate(BaseModel):
    head_name: str
    amount: float

class ExpenseCreate(BaseModel):
    item_name: str
    amount: float

# --- Authentication Endpoints ---

@app.post("/signup", response_model=Token)
def signup(user_data: UserAuth, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user_data: UserAuth, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Income Endpoints ---

@app.post("/add-income")
def add_income(
    income: IncomeCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Server ki aaj ki auto-date ke sath save hoga
    new_income = models.Income(
        head_name=income.head_name, 
        amount=income.amount, 
        entry_date=date.today(),
        user_id=current_user.id
    )
    db.add(new_income)
    db.commit()
    return {"message": "Income added successfully"}

# --- Expense & Items Endpoints ---

@app.get("/items")
def get_user_items(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    items = db.query(models.Item).filter(models.Item.user_id == current_user.id).all()
    return [item.name for item in items]

@app.post("/add-expense")
def add_expense(
    expense: ExpenseCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if item exists, else add to dropdown suggestions
    existing_item = db.query(models.Item).filter(
        models.Item.name == expense.item_name, 
        models.Item.user_id == current_user.id
    ).first()

    if not existing_item:
        new_item = models.Item(name=expense.item_name, user_id=current_user.id)
        db.add(new_item)

    # Save Expense with Server Auto Date
    new_expense = models.Expense(
        item_name=expense.item_name, 
        amount=expense.amount, 
        entry_date=date.today(),
        user_id=current_user.id
    )
    db.add(new_expense)
    db.commit()
    return {"message": "Expense added successfully"}

# --- Filtered Report & Summary Dashboard Endpoint ---

@app.get("/dashboard-summary")
def get_dashboard_summary(
    start_date: Optional[date] = Query(None, description="Start date for report filter (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for report filter (YYYY-MM-DD)"),
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    # Initial Queries for current user
    income_query = db.query(models.Income).filter(models.Income.user_id == current_user.id)
    expense_query = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)

    # Date Range Filter Applicator
    if start_date:
        income_query = income_query.filter(models.Income.entry_date >= start_date)
        expense_query = expense_query.filter(models.Expense.entry_date >= start_date)
    
    if end_date:
        income_query = income_query.filter(models.Income.entry_date <= end_date)
        expense_query = expense_query.filter(models.Expense.entry_date <= end_date)

    incomes = income_query.order_by(models.Income.entry_date.desc()).all()
    expenses = expense_query.order_by(models.Expense.entry_date.desc()).all()

    total_income = sum(inc.amount for inc in incomes)
    total_expense = sum(exp.amount for exp in expenses)
    remaining_balance = total_income - total_expense

    return {
        "user_email": current_user.email,
        "filter_applied": {"start_date": start_date, "end_date": end_date},
        "total_income": total_income,
        "total_expense": total_expense,
        "remaining_balance": remaining_balance,
        "incomes_list": [
            {
                "id": i.id, 
                "head": i.head_name, 
                "amount": i.amount, 
                "date": str(i.entry_date)
            } for i in incomes
        ],
        "expenses_list": [
            {
                "id": e.id, 
                "item": e.item_name, 
                "amount": e.amount, 
                "date": str(e.entry_date)
            } for e in expenses
        ],
    }