import re
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class ClienteBase(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str
    comuna: str

    @field_validator("nombre", "apellido")
    @classmethod
    def solo_letras(cls, v: str) -> str:
        if not re.match(r"^[A-Za-zÀ-ɏ\s]+$", v.strip()):
            raise ValueError("Solo se permiten letras y espacios")
        if len(v.strip()) < 2:
            raise ValueError("Debe tener al menos 2 caracteres")
        return v.strip().title()

    @field_validator("telefono")
    @classmethod
    def formato_telefono(cls, v: str) -> str:
        # Acepta formatos: +56912345678, 912345678, 56912345678
        limpio = re.sub(r"[\s\-]", "", v)
        if not re.match(r"^(\+?56)?9\d{8}$", limpio):
            raise ValueError("Teléfono inválido. Formato esperado: +56912345678 o 912345678")
        return limpio

    @field_validator("comuna")
    @classmethod
    def comuna_valida(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("La comuna debe tener al menos 2 caracteres")
        return v.strip().title()


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    comuna: Optional[str] = None
    activo: Optional[bool] = None


class ClienteOut(BaseModel):
    id: UUID
    nombre: str
    apellido: str
    email: str
    telefono: str
    comuna: str
    activo: bool
    created_at: datetime

    class Config:
        from_attributes = True
