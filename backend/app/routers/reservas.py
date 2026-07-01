from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from typing import List
from uuid import UUID
from datetime import date

from app.database import get_db
from app.models.reserva import Reserva
from app.models.horario_cancha import HorarioCancha
from app.schemas.reserva import ReservaCreate, ReservaUpdateEstado, ReservaOut
from app.services.reserva_service import crear_reserva

router = APIRouter()


# ── Listar todas las reservas ──────────────────────────────────────────────────
@router.get("/", response_model=List[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    return (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.cancha))
        .order_by(Reserva.fecha, Reserva.hora_inicio)
        .all()
    )


# ── Reservas por cancha ───────────────────────────────────────────────────────
@router.get("/cancha/{cancha_id}", response_model=List[ReservaOut])
def reservas_por_cancha(cancha_id: UUID, db: Session = Depends(get_db)):
    return (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.cancha))
        .filter(Reserva.cancha_id == cancha_id, Reserva.estado != "cancelada")
        .order_by(Reserva.fecha, Reserva.hora_inicio)
        .all()
    )


# ── Disponibilidad de una cancha en una fecha ─────────────────────────────────
@router.get("/disponibilidad/{cancha_id}/{fecha}")
def disponibilidad_cancha(cancha_id: UUID, fecha: date, db: Session = Depends(get_db)):
    dia_semana = fecha.weekday()
    horario = db.query(HorarioCancha).filter(
        HorarioCancha.cancha_id == cancha_id,
        HorarioCancha.dia_semana == dia_semana,
        HorarioCancha.activo == True,
    ).first()

    if not horario:
        return {"disponible": False, "bloques": []}

    reservas_del_dia = db.query(Reserva).filter(
        Reserva.cancha_id == cancha_id,
        Reserva.fecha == fecha,
        Reserva.estado != "cancelada",
    ).all()

    from datetime import datetime, timedelta
    bloques = []
    cursor = datetime.combine(fecha, horario.hora_inicio)
    fin_jornada = datetime.combine(fecha, horario.hora_fin)

    while cursor + timedelta(minutes=60) <= fin_jornada:
        hora_bloque = cursor.time()
        fin_bloque = (cursor + timedelta(minutes=60)).time()
        ocupado = any(
            r.hora_inicio <= hora_bloque < r.hora_fin or
            r.hora_inicio < fin_bloque <= r.hora_fin
            for r in reservas_del_dia
        )
        reserva_info = None
        if ocupado:
            r = next((
                r for r in reservas_del_dia
                if r.hora_inicio <= hora_bloque < r.hora_fin
            ), None)
            if r:
                reserva_info = {
                    "cliente": f"{r.cliente.nombre} {r.cliente.apellido}" if r.cliente else "",
                    "hora_inicio": str(r.hora_inicio)[:5],
                    "hora_fin": str(r.hora_fin)[:5],
                }
        bloques.append({
            "hora": str(hora_bloque)[:5],
            "hora_fin": str(fin_bloque)[:5],
            "ocupado": ocupado,
            "reserva": reserva_info,
        })
        cursor += timedelta(minutes=60)

    return {"disponible": True, "bloques": bloques}


# ── Crear reserva ─────────────────────────────────────────────────────────────
@router.post("/", response_model=ReservaOut, status_code=201)
def nueva_reserva(data: ReservaCreate, db: Session = Depends(get_db)):
    return crear_reserva(db, data)


# ── Obtener reserva por ID ────────────────────────────────────────────────────
@router.get("/{reserva_id}", response_model=ReservaOut)
def obtener_reserva(reserva_id: UUID, db: Session = Depends(get_db)):
    reserva = (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.cancha))
        .filter(Reserva.id == reserva_id)
        .first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva


# ── Cambiar estado de reserva ─────────────────────────────────────────────────
@router.patch("/{reserva_id}/estado", response_model=ReservaOut)
def cambiar_estado_reserva(
    reserva_id: UUID,
    data: ReservaUpdateEstado,
    db: Session = Depends(get_db),
):
    reserva = (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.cancha))
        .filter(Reserva.id == reserva_id)
        .first()
    )
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    estados_validos = ["confirmada", "completada", "cancelada"]
    if data.estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Debe ser uno de: {estados_validos}"
        )

    reserva.estado = data.estado
    db.commit()
    db.refresh(reserva)
    return reserva


# ── Cancelar por token (enlace del email) ─────────────────────────────────────
@router.get("/cancelar/{token}", response_class=HTMLResponse)
def cancelar_por_token(token: str, db: Session = Depends(get_db)):
    reserva = (
        db.query(Reserva)
        .options(joinedload(Reserva.cliente), joinedload(Reserva.cancha))
        .filter(Reserva.cancel_token == token)
        .first()
    )

    if not reserva:
        return HTMLResponse(
            _html_error("Token inválido", "Este enlace de cancelación no es válido o ya fue usado."),
            status_code=404,
        )

    if reserva.estado == "cancelada":
        return HTMLResponse(
            _html_info("Ya cancelada", "Esta reserva ya estaba cancelada anteriormente."),
            status_code=200,
        )

    if reserva.estado == "completada":
        return HTMLResponse(
            _html_error("No cancelable", "Esta reserva ya fue completada y no se puede cancelar."),
            status_code=400,
        )

    reserva.estado = "cancelada"
    reserva.cancel_token = None
    db.commit()

    nombre = reserva.cliente.nombre if reserva.cliente else "Cliente"
    cancha = reserva.cancha.nombre if reserva.cancha else ""
    fecha = str(reserva.fecha)
    hora = str(reserva.hora_inicio)[:5]
    return HTMLResponse(_html_ok(nombre, cancha, fecha, hora), status_code=200)


# ── HTML helpers ──────────────────────────────────────────────────────────────

def _base_html(titulo: str, icono: str, color: str, mensaje: str, detalle: str = "") -> str:
    return f"""
    <!DOCTYPE html><html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>{titulo} — Canchas Reservas</title>
      <style>
        *{{box-sizing:border-box;margin:0;padding:0}}
        body{{font-family:Inter,Arial,sans-serif;background:#f0fdf4;min-height:100vh;
              display:flex;align-items:center;justify-content:center;padding:20px}}
        .card{{background:#fff;border-radius:20px;padding:48px 40px;max-width:440px;
               width:100%;text-align:center;box-shadow:0 8px 32px rgba(5,150,105,0.12)}}
        .icon{{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;
               justify-content:center;font-size:32px;margin:0 auto 24px}}
        h1{{font-size:24px;font-weight:900;color:#111827;margin-bottom:8px}}
        p{{color:#6b7280;font-size:15px;line-height:1.6;margin-bottom:8px}}
        .detail{{background:#f9fafb;border-radius:12px;padding:16px 20px;margin:20px 0;text-align:left}}
        .detail p{{font-size:14px;margin-bottom:4px}}
        .detail strong{{color:#111827}}
        .btn{{display:inline-block;margin-top:24px;background:#059669;color:#fff;
              font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:15px}}
        .brand{{color:#9ca3af;font-size:13px;margin-top:24px}}
      </style>
    </head>
    <body><div class="card">
      <div class="icon" style="background:{color}20"><span>{icono}</span></div>
      <h1>{titulo}</h1>
      <p>{mensaje}</p>
      {detalle}
      <p class="brand">⚽ Canchas Reservas</p>
    </div></body></html>
    """


def _html_ok(nombre: str, cancha: str, fecha: str, hora: str) -> str:
    detalle = f"""
    <div class="detail">
      <p>Cliente: <strong>{nombre}</strong></p>
      <p>Cancha: <strong>{cancha}</strong></p>
      <p>Fecha: <strong>{fecha}</strong></p>
      <p>Hora: <strong>{hora}</strong></p>
    </div>
    <a href="http://localhost:5173/reservar" class="btn">Hacer nueva reserva</a>
    """
    return _base_html(
        "Reserva cancelada", "✅", "#22c55e",
        "Tu reserva ha sido cancelada exitosamente.",
        detalle,
    )


def _html_error(titulo: str, mensaje: str) -> str:
    return _base_html(titulo, "❌", "#ef4444", mensaje)


def _html_info(titulo: str, mensaje: str) -> str:
    return _base_html(titulo, "ℹ️", "#3b82f6", mensaje)
