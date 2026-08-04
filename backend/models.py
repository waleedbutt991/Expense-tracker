from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    incomes = relationship("Income", back_populates="owner")
    expenses = relationship("Expense", back_populates="owner")
    loans = relationship("Loan", back_populates="owner")

class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    head_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, default="cash")  # 'cash' or 'credit'
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="incomes")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payment_mode = Column(String, default="cash")  # 'cash' or 'credit'
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="expenses")

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    person_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    loan_type = Column(String, nullable=False)  # 'given' (pese diye) or 'taken' (pese liye)
    status = Column(String, default="pending")    # 'pending' or 'settled'
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="loans")