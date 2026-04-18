"""Add password reset token columns to users table."""
from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    conn.execute(text("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(100),
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP WITH TIME ZONE;
    """))
    conn.commit()
    print("Done. reset_token columns added to users.")
