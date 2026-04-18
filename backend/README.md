# AcadeX Backend

FastAPI backend for the TS-12 academic risk platform.

## Structure

- `app/core` - settings and security helpers
- `app/db` - SQLAlchemy engine, session, and base model
- `app/models` - PostgreSQL tables
- `app/schemas` - request and response models
- `app/services` - auth business logic
- `app/api/routes` - API routers

## Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update `DATABASE_URL` and `JWT_SECRET_KEY`.

4. Make sure PostgreSQL is running and the database in `DATABASE_URL` exists.

5. Start the API:

```powershell
uvicorn app.main:app --reload
```

## Auth Endpoints

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

## Notes

- Tables are created automatically on startup for development.
- `login` requires an existing user row in PostgreSQL.
- `logout` revokes the current JWT using the token blacklist table.

API will be available at:
- `http://127.0.0.1:8000/`
- Docs: `http://127.0.0.1:8000/docs`
