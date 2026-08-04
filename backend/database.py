import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Environment Variable Se DATABASE_URL Load Karein
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 2. Agar Vercel Env Variable na mile, to Direct Supabase Link Use Karein (Fallback)
if not SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL = "postgresql://postgres.frjzwmgdfcehhibcodgy:Tf3LZuSoSOqSBpHY@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

# 3. SQLAlchemy Fix for postgres://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 4. Engine Connection
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()