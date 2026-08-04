import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

import database, models, auth

app = FastAPI(title="Expense & Income Tracker API")

@app.on_event("startup")
def startup():
    try:
        models.Base.metadata.create_all(bind=database.engine)
    except Exception as e:
        print("Database startup connection error:", e)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---
class UserAuth(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class IncomeCreate(BaseModel):
    head_name: str
    amount: float
    payment_mode: Optional[str] = "cash"

class IncomeResponse(BaseModel):
    id: int
    head_name: str
    amount: float
    payment_mode: str
    created_at: datetime
    class Config:
        orm_mode = True

class ExpenseCreate(BaseModel):
    item_name: str
    amount: float
    payment_mode: Optional[str] = "cash"

class ExpenseResponse(BaseModel):
    id: int
    item_name: str
    amount: float
    payment_mode: str
    created_at: datetime
    class Config:
        orm_mode = True

class LoanCreate(BaseModel):
    person_name: str
    amount: float
    loan_type: str # 'given' or 'taken'

class LoanResponse(BaseModel):
    id: int
    person_name: str
    amount: float
    loan_type: str
    status: str
    created_at: datetime
    class Config:
        orm_mode = True

# --- Auth ---
@app.get("/")
@app.get("/api")
def root():
    return {"status": "ok"}

@app.post("/api/signup", response_model=Token)
def signup(user_data: UserAuth, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(user_data.password)
    new_user = models.User(email=user_data.email, password_hash=hashed_pwd)
    db.add(new_user)
    db.commit()

    access_token = auth.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/login", response_model=Token)
def login(user_data: UserAuth, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Incomes ---
@app.post("/api/incomes", response_model=IncomeResponse)
def create_income(income: IncomeCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_income = models.Income(head_name=income.head_name, amount=income.amount, payment_mode=income.payment_mode, user_id=current_user.id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@app.get("/api/incomes", response_model=List[IncomeResponse])
def get_incomes(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Income).filter(models.Income.user_id == current_user.id).all()

# --- Expenses ---
@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_expense = models.Expense(item_name=expense.item_name, amount=expense.amount, payment_mode=expense.payment_mode, user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()

# --- Loans Endpoints ---
@app.post("/api/loans", response_model=LoanResponse)
def create_loan(loan: LoanCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_loan = models.Loan(person_name=loan.person_name, amount=loan.amount, loan_type=loan.loan_type, user_id=current_user.id)
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@app.get("/api/loans", response_model=List[LoanResponse])
def get_loans(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Loan).filter(models.Loan.user_id == current_user.id).all()

@app.put("/api/loans/{loan_id}/settle")
def settle_loan(loan_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    loan = db.query(models.Loan).filter(models.Loan.id == loan_id, models.Loan.user_id == current_user.id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan record not found")
    loan.status = "settled"
    db.commit()
    return {"status": "success"}