"""Drop the set_updated_at trigger from the alerts table (it references a
column that doesn't exist)."""
from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    conn.execute(text("DROP TRIGGER IF EXISTS set_updated_at ON alerts;"))
    conn.commit()
    print("Trigger dropped successfully.")
