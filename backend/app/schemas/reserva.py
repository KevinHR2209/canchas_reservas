from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import date, time, datetime
from app.schemas.cliente import ClienteOut
from app.schemas.cancha import CanchaOut


class ReservaBase(BaseModel):
    cliente_id: UUID
    cancha_id: UUID
    fecha: date
    hora_inicio: time
    notas: Optional[str] = None

    @field_validator("fecha")
    @classmethod
    def fecha_no_pasada(cls, v: date) -> date:
        from datetime import date as today_date
        if v < today_date.today():
            raise ValueError("No se puede reservar en una fecha pasada")
        return v

    @field_validator("hora_inicio")
    @classmethod
    def hora_en_punto(cls, v: time) -> time:
        """Las reservas son por bloques de 1 hora exacta, se valida que sea en punto o media."""
        if v.minute not in (0, 30):
            raise ValueError("La hora de inicio debe ser en punto (:00) o en media (:30)")
        return v


class ReservaCreate(ReservaBase):
    pass


class ReservaUpdateEstado(BaseModel):
    estado: str

    @field_validator("estado")
    @classmethod
    def estado_valido(cls, v: str) -> str:
        validos = ["confirmada", "completada", "cancelada"]
        if v not in validos:
            raise ValueError(f"Estado inválido. Debe ser uno de: {validos}")
        return v


class ReservaOut(BaseModel):
    id: UUID
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str
    notas: Optional[str]
    created_at: datetime
    cliente: ClienteOut
    cancha: CanchaOut

    class Config:
        from_attributes = True
