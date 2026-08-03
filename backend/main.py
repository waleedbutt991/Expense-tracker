import sys
import os

# Fix Python path for Vercel Serverless environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime

import database, models, auth

app = FastAPI(title="Expense & Income Tracker API")

# Lazy DB Initialization for Vercel Serverless
@app.on_event("startup")
def startup():
    try:
        models.Base.metadata.create_all(bind=database.engine)
    except Exception as e:
        print("Database startup connection error:", e)

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

class IncomeResponse(BaseModel):
    id: int
    head_name: str
    amount: float
    created_at: datetime
    class Config:
        orm_mode = True

class ExpenseCreate(BaseModel):
    item_name: str
    amount: float

class ExpenseResponse(BaseModel):
    id: int
    item_name: str
    amount: float
    created_at: datetime
    class Config:
        orm_mode = True

# --- Root & Auth Endpoints ---

@app.get("/")
@app.get("/api")
def root():
    return {"status": "ok", "message": "Expense Tracker API is Running"}

@app.post("/signup")
@app.post("/api/signup", response_model=Token)
def signup(user_data: UserAuth, db: Session = Depends(database.get_db)):
    try:
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
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
@app.post("/api/login", response_model=Token)
def login(user_data: UserAuth, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Income Endpoints ---

@app.post("/incomes", response_model=IncomeResponse)
@app.post("/api/incomes", response_model=IncomeResponse)
def create_income(income: IncomeCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_income = models.Income(head_name=income.head_name, amount=income.amount, user_id=current_user.id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@app.get("/incomes", response_model=List[IncomeResponse])
@app.get("/api/incomes", response_model=List[IncomeResponse])
def get_incomes(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Income).filter(models.Income.user_id == current_user.id).all()

# --- Expense Endpoints ---

@app.post("/expenses", response_model=ExpenseResponse)
@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_expense = models.Expense(item_name=expense.item_name, amount=expense.amount, user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/expenses", response_model=List[ExpenseResponse])
@app.get("/api/expenses", response_model=List[ExpenseResponse])
def get_expenses(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    return db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()