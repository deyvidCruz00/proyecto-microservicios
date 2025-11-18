from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import os

# Database configuration
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

if SQLALCHEMY_DATABASE_URL and SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    # Fix for newer PostgreSQL drivers
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = None
SessionLocal = None
Base = declarative_base()

def init_database():
    """Initialize database connection"""
    global engine, SessionLocal
    
    if not SQLALCHEMY_DATABASE_URL:
        print("Warning: DATABASE_URL not set, database operations will be disabled")
        return
    
    try:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"sslmode": "require"} if "render.com" in SQLALCHEMY_DATABASE_URL else {}
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        # Test connection
        with engine.connect() as connection:
            print("✅ Database connection successful")
            
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        engine = None
        SessionLocal = None


def create_tables():
    """Create database tables"""
    from app.models.notification import Base as NotificationBase
    
    if engine is None:
        print("⚠️ Cannot create tables: database engine not initialized")
        return
    
    try:
        NotificationBase.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")


def get_database():
    """Get database session"""
    if SessionLocal is None:
        return None
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def is_database_available():
    """Check if database is available"""
    return engine is not None and SessionLocal is not None