from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime


class CanchaBase(BaseModel):
    nombre: str
    tipo: Literal["futbol6", "padel"]
    descripcion: Optional[str] = None

    @field_validator("nombre")
    @classmethod
    def nombre_valido(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v.strip()


class CanchaCreate(CanchaBase):
    pass


class CanchaUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None


class CanchaOut(BaseModel):
    id: UUID
    nombre: str
    tipo: str
    descripcion: Optional[str]
    activa: bool
    created_at: datetime

    class Config:
        from_attributes = True
