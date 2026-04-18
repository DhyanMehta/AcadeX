# AcadeX Backend (FastAPI)

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

3. Run the development server:

```powershell
uvicorn app.main:app --reload
```

API will be available at:
- `http://127.0.0.1:8000/`
- Docs: `http://127.0.0.1:8000/docs`
