import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Direct Supabase Fallback Link (Agar Env Var Vercel par fail ho jaye)
DEFAULT_DB_URL = "postgresql://postgres.frjzwmgdfcehhibcodgy:Tf3LZuSoSOqSBpHY@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

if not DATABASE_URL or "example.com" in DATABASE_URL:
    DATABASE_URL = DEFAULT_DB_URL

# postgres:// to postgresql:// fix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SSL & Connection Engine options to avoid 500 Server Crashes on Vercel
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()