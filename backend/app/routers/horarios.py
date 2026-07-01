from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.horario_cancha import HorarioCancha
from app.models.cancha import Cancha
from app.schemas.horario import HorarioCreate, HorarioOut

router = APIRouter()

DIAS = {0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}


@router.get("/cancha/{cancha_id}", response_model=List[HorarioOut])
def horarios_por_cancha(cancha_id: UUID, db: Session = Depends(get_db)):
    return db.query(HorarioCancha).filter(
        HorarioCancha.cancha_id == cancha_id,
        HorarioCancha.activo == True,
    ).order_by(HorarioCancha.dia_semana).all()


@router.post("/", response_model=HorarioOut, status_code=201)
def crear_horario(data: HorarioCreate, db: Session = Depends(get_db)):
    cancha = db.query(Cancha).filter(Cancha.id == data.cancha_id, Cancha.activa == True).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada o inactiva")

    existente = db.query(HorarioCancha).filter(
        HorarioCancha.cancha_id == data.cancha_id,
        HorarioCancha.dia_semana == data.dia_semana,
    ).first()
    if existente:
        raise HTTPException(
            status_code=409,
            detail=f"La cancha ya tiene horario para el {DIAS[data.dia_semana]}"
        )

    horario = HorarioCancha(**data.model_dump())
    db.add(horario)
    db.commit()
    db.refresh(horario)
    return horario


@router.patch("/{horario_id}/toggle", response_model=HorarioOut)
def toggle_horario(horario_id: UUID, db: Session = Depends(get_db)):
    horario = db.query(HorarioCancha).filter(HorarioCancha.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    horario.activo = not horario.activo
    db.commit()
    db.refresh(horario)
    return horario


@router.delete("/{horario_id}", status_code=204)
def eliminar_horario(horario_id: UUID, db: Session = Depends(get_db)):
    horario = db.query(HorarioCancha).filter(HorarioCancha.id == horario_id).first()
    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    db.delete(horario)
    db.commit()
