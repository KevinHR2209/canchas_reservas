from pydantic import BaseModel, field_validator
from typing import Optional
from uuid import UUID
from datetime import time


DIAS_SEMANA = {0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}


class HorarioBase(BaseModel):
    cancha_id: UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    activo: Optional[bool] = True

    @field_validator("dia_semana")
    @classmethod
    def dia_valido(cls, v: int) -> int:
        if v not in range(7):
            raise ValueError("dia_semana debe estar entre 0 (Lunes) y 6 (Domingo)")
        return v

    @field_validator("hora_fin")
    @classmethod
    def horario_coherente(cls, v: time, info) -> time:
        hora_inicio = info.data.get("hora_inicio")
        if hora_inicio and v <= hora_inicio:
            raise ValueError("hora_fin debe ser posterior a hora_inicio")
        return v


class HorarioCreate(HorarioBase):
    pass


class HorarioOut(BaseModel):
    id: UUID
    cancha_id: UUID
    dia_semana: int
    hora_inicio: time
    hora_fin: time
    activo: bool

    class Config:
        from_attributes = True
