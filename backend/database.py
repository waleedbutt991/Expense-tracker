import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Direct connection fallback with required SSL parameters for Vercel
DEFAULT_DB_URL = "postgresql://postgres.frjzwmgdfcehhibcodgy:Tf3LZuSoSOqSBpHY@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

if not DATABASE_URL or "example.com" in DATABASE_URL:
    DATABASE_URL = DEFAULT_DB_URL

# Fix postgres:// prefix for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure sslmode=require is present in URL
if "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require" if "?" not in DATABASE_URL else "&sslmode=require"

# Engine setup optimized for Vercel Serverless execution
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,      # Tests connection before using it
        pool_recycle=280,       # Recycles stale connections
        connect_args={"connect_timeout": 15}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()