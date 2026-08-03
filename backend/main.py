from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, datetime

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

class ExpenseCreate(BaseModel):
    item_name: str
    amount: float

# --- Endpoints (Supporting both /api/ dynamic routes) ---

@app.get("/")
@app.get("/api")
def root():
    return {"status": "ok"}

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
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/login")
@app.post("/api/login", response_model=Token)
def login(user_data: UserAuth, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if not user or not auth.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}