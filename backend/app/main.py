from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import engine, Base
from app.routes.jobs import router as jobs_router
from app.routes.certificates import router as certificates_router
from app.routes.verification import router as verification_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Bulk Certificate Generation, Job Tracking, and Authenticity Verification System",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & local integration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
            }
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Validation error")
        errors.append(f"{field}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "; ".join(errors),
            }
        },
    )


# Health check
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


# Include Routers
app.include_router(jobs_router, prefix=settings.API_V1_PREFIX)
app.include_router(certificates_router, prefix=settings.API_V1_PREFIX)
app.include_router(verification_router, prefix=settings.API_V1_PREFIX)
