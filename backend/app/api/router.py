from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.setup import router as setup_router
from app.api.routes.student import router as student_router
from app.api.routes.teacher import router as teacher_router
from app.api.routes.coordinator import router as coordinator_router
from app.api.routes.risk import router_risk, router_ml
from app.api.routes.lms import router as lms_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.interventions import router as interventions_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(setup_router)
api_router.include_router(student_router)
api_router.include_router(teacher_router)
api_router.include_router(coordinator_router)
api_router.include_router(router_risk)
api_router.include_router(router_ml)
api_router.include_router(lms_router)
api_router.include_router(alerts_router)
api_router.include_router(interventions_router)
