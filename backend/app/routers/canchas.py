from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models.cancha import Cancha
from app.schemas.cancha import CanchaCreate, CanchaUpdate, CanchaOut

router = APIRouter()


@router.get("/", response_model=List[CanchaOut])
def listar_canchas(db: Session = Depends(get_db)):
    return db.query(Cancha).order_by(Cancha.tipo, Cancha.nombre).all()


@router.get("/activas", response_model=List[CanchaOut])
def canchas_activas(db: Session = Depends(get_db)):
    return db.query(Cancha).filter(Cancha.activa == True).order_by(Cancha.tipo, Cancha.nombre).all()


@router.get("/{cancha_id}", response_model=CanchaOut)
def obtener_cancha(cancha_id: UUID, db: Session = Depends(get_db)):
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return cancha


@router.post("/", response_model=CanchaOut, status_code=201)
def crear_cancha(data: CanchaCreate, db: Session = Depends(get_db)):
    existente = db.query(Cancha).filter(Cancha.nombre == data.nombre).first()
    if existente:
        raise HTTPException(status_code=409, detail="Ya existe una cancha con ese nombre")
    cancha = Cancha(**data.model_dump())
    db.add(cancha)
    db.commit()
    db.refresh(cancha)
    return cancha


@router.patch("/{cancha_id}", response_model=CanchaOut)
def actualizar_cancha(cancha_id: UUID, data: CanchaUpdate, db: Session = Depends(get_db)):
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(cancha, campo, valor)
    db.commit()
    db.refresh(cancha)
    return cancha


@router.delete("/{cancha_id}", status_code=204)
def desactivar_cancha(cancha_id: UUID, db: Session = Depends(get_db)):
    cancha = db.query(Cancha).filter(Cancha.id == cancha_id).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    cancha.activa = False
    db.commit()
