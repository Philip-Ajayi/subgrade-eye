import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "SubGrade-Eye API"
    APP_VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # InSAR Baseline Thresholds
    CRITICAL_SUBSIDENCE_MM_YEAR: float = -10.0
    WARNING_SUBSIDENCE_MM_YEAR: float = -5.0
    CRITICAL_DISPLACEMENT_LIMIT_MM: float = 25.0

settings = Settings()