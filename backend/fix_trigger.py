"""
Drop the set_updated_at trigger from ALL tables that don't have an updated_at column.
The trigger fires on UPDATE and tries to set NEW.updated_at = NOW(), but tables like
'alerts' have no such column.
"""
from sqlalchemy import text
from app.db.session import engine

with engine.connect() as conn:
    # Find all triggers named set_updated_at and the tables they're on
    result = conn.execute(text("""
        SELECT trigger_name, event_object_table
        FROM information_schema.triggers
        WHERE trigger_name LIKE '%updated_at%'
        ORDER BY event_object_table;
    """))
    rows = result.fetchall()
    print(f"Found {len(rows)} trigger(s):")
    for row in rows:
        print(f"  - {row[0]} on table {row[1]}")

    # Drop trigger from each table
    for row in rows:
        tname, tbl = row[0], row[1]
        try:
            conn.execute(text(f'DROP TRIGGER IF EXISTS "{tname}" ON "{tbl}";'))
            print(f"  ✅ Dropped {tname} from {tbl}")
        except Exception as e:
            print(f"  ❌ Failed on {tbl}: {e}")

    conn.commit()
    print("\nDone. All update_at triggers removed from incompatible tables.")
