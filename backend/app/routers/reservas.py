import os
import requests
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel

from app.database import get_db, SessionLocal
from app.models.reserva import Reserva
from app.models.cliente import Cliente
from app.models.horario_cancha import HorarioCancha
from app.schemas.reserva import ReservaCreate, ReservaUpdateEstado, ReservaOut
from app.services.reserva_service import crear_reserva

router = APIRouter()

# --- MIDDLEWARE KRONO: CACHÉ EN MEMORIA (Simula Redis) ---
WAITLIST_CACHE = []

class WaitlistRequest(BaseModel):
    cancha_id: str
    fecha: str
    hora_deseada: str
    nombre: str
    telefono: str
    email: str

@router.post("/middleware/espera")
def unirse_espera_middleware(req: WaitlistRequest):
    # Guardamos la intención del usuario en la RAM del Middleware
    WAITLIST_CACHE.append(req.model_dump())
    print(f"[MIDDLEWARE] Cliente {req.nombre} agregado a caché de espera para {req.fecha} a las {req.hora_deseada}")
    return {"success": True, "message": "Anotado en caché temporal"}

def notificar_krono_canchas(reserva_id: str):
    db = SessionLocal()
    try:
        reserva = db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).filter(Reserva.id == reserva_id).first()
        if not reserva: return

        # 1. Buscar en nuestra CACHÉ EN MEMORIA a los interesados para esta fecha y hora
        interesados = [
            req for req in WAITLIST_CACHE
            if req['cancha_id'] == str(reserva.cancha_id)
               and req['fecha'] == str(reserva.fecha)
               and req['hora_deseada'] == str(reserva.hora_inicio)[:5]
        ]

        if not interesados:
            print("[KRONO] No hay clientes en la caché de espera para este bloque. Abortando.", flush=True)
            return

        waitlist = []
        for index, req in enumerate(interesados):
            tel = req['telefono'] if req['telefono'].startswith("+569") else "+56900000000"
            waitlist.append({
                "patient_id": f"TEMP-CACHE-{index}", # ID temporal ya que no están en DB
                "display_name": req['nombre'],
                "phone": tel,
                "email": req['email'],
                "metrics": {
                    "tiempo_en_espera": 1.0 # Métrica simulada para la subasta
                }
            })

        payload = {
            "event_type": "appointment_cancelled",
            "source_system_id": "SPORTCENTER-01",
            "return_url": "http://host.docker.internal:8001/api/reservas/krono-webhook",
            "cancellation": {
                "appointment_id": str(reserva.id),
                "cancelled_at": datetime.utcnow().isoformat() + "Z",
                "slot": {
                    "date": str(reserva.fecha),
                    "start_time": str(reserva.hora_inicio)[:5],
                    "end_time": str(reserva.hora_fin)[:5],
                    "doctor_name": reserva.cancha.nombre,
                    "specialty": "Arriendo de Cancha",
                    "location": "Sede Principal"
                },
                "cancelled_patient": {
                    "patient_id": str(reserva.cliente_id),
                    "display_name": f"{reserva.cliente.nombre} {reserva.cliente.apellido}"
                }
            },
            "waitlist": waitlist
        }

        # 2. Enviar a Krono
        resp = requests.post("http://host.docker.internal:3000/api/v1/webhook/cancellation", json=payload, timeout=5)
        resp.raise_for_status()
        print(f"[KRONO] Subasta de canchas iniciada: {resp.json().get('transaction_id')}", flush=True)

        # 3. Limpiar la caché (opcional, para evitar re-notificar si la subasta falla y luego se cancela otra vez)
        WAITLIST_CACHE[:] = [req for req in WAITLIST_CACHE if req not in interesados]

    except Exception as e:
        print(f"[KRONO] Error de integración: {e}", flush=True)
    finally:
        db.close()

# --- ENDPOINT DE RETORNO KRONO ---
class KronoReturnPayload(BaseModel):
    status: str
    appointment_id: str
    winner: dict | None = None
    message: str | None = None

@router.post("/krono-webhook")
def recibir_resultado_krono(payload: KronoReturnPayload, db: Session = Depends(get_db)):
    print(f"[KRONO] Resultado recibido: {payload.status} para reserva {payload.appointment_id}", flush=True)
    return {"received": True}


# --- RUTAS ORIGINALES ---
@router.get("/", response_model=List[ReservaOut])
def listar_reservas(db: Session = Depends(get_db)):
    return db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).order_by(Reserva.fecha, Reserva.hora_inicio).all()

@router.get("/cancha/{cancha_id}", response_model=List[ReservaOut])
def reservas_por_cancha(cancha_id: UUID, db: Session = Depends(get_db)):
    return db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).filter(Reserva.cancha_id == cancha_id, Reserva.estado != "cancelada").order_by(Reserva.fecha, Reserva.hora_inicio).all()

@router.get("/disponibilidad/{cancha_id}/{fecha}")
def disponibilidad_cancha(cancha_id: UUID, fecha: date, db: Session = Depends(get_db)):
    dia_semana = fecha.weekday()
    horario = db.query(HorarioCancha).filter(HorarioCancha.cancha_id == cancha_id, HorarioCancha.dia_semana == dia_semana, HorarioCancha.activo == True).first()
    if not horario: return {"disponible": False, "bloques": []}

    reservas_del_dia = db.query(Reserva).filter(Reserva.cancha_id == cancha_id, Reserva.fecha == fecha, Reserva.estado != "cancelada").all()
    from datetime import datetime as dt, timedelta
    bloques = []
    cursor = dt.combine(fecha, horario.hora_inicio)
    fin_jornada = dt.combine(fecha, horario.hora_fin)

    while cursor + timedelta(minutes=60) <= fin_jornada:
        hora_bloque = cursor.time()
        fin_bloque = (cursor + timedelta(minutes=60)).time()
        ocupado = any(r.hora_inicio <= hora_bloque < r.hora_fin or r.hora_inicio < fin_bloque <= r.hora_fin for r in reservas_del_dia)
        reserva_info = None
        if ocupado:
            r = next((r for r in reservas_del_dia if r.hora_inicio <= hora_bloque < r.hora_fin), None)
            if r: reserva_info = {"cliente": f"{r.cliente.nombre} {r.cliente.apellido}" if r.cliente else "", "hora_inicio": str(r.hora_inicio)[:5], "hora_fin": str(r.hora_fin)[:5]}
        bloques.append({"hora": str(hora_bloque)[:5], "hora_fin": str(fin_bloque)[:5], "ocupado": ocupado, "reserva": reserva_info})
        cursor += timedelta(minutes=60)
    return {"disponible": True, "bloques": bloques}

@router.post("/", response_model=ReservaOut, status_code=201)
def nueva_reserva(data: ReservaCreate, db: Session = Depends(get_db)):
    return crear_reserva(db, data)

@router.get("/{reserva_id}", response_model=ReservaOut)
def obtener_reserva(reserva_id: UUID, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).filter(Reserva.id == reserva_id).first()
    if not reserva: raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

@router.patch("/{reserva_id}/estado", response_model=ReservaOut)
def cambiar_estado_reserva(reserva_id: UUID, data: ReservaUpdateEstado, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).filter(Reserva.id == reserva_id).first()
    if not reserva: raise HTTPException(status_code=404, detail="Reserva no encontrada")
    estados_validos = ["confirmada", "completada", "cancelada"]
    if data.estado not in estados_validos: raise HTTPException(status_code=400, detail=f"Estado inválido. Debe ser uno de: {estados_validos}")

    reserva.estado = data.estado
    db.commit()
    db.refresh(reserva)

    if data.estado == "cancelada":
        background_tasks.add_task(notificar_krono_canchas, str(reserva.id))

    return reserva

@router.get("/cancelar/{token}", response_class=HTMLResponse)
def cancelar_por_token(token: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).options(joinedload(Reserva.cliente), joinedload(Reserva.cancha)).filter(Reserva.cancel_token == token).first()
    if not reserva: return HTMLResponse(_html_error("Token inválido", "Este enlace de cancelación no es válido o ya fue usado."), status_code=404)
    if reserva.estado == "cancelada": return HTMLResponse(_html_info("Ya cancelada", "Esta reserva ya estaba cancelada anteriormente."), status_code=200)
    if reserva.estado == "completada": return HTMLResponse(_html_error("No cancelable", "Esta reserva ya fue completada y no se puede cancelar."), status_code=400)

    reserva.estado = "cancelada"
    reserva.cancel_token = None
    db.commit()

    background_tasks.add_task(notificar_krono_canchas, str(reserva.id))

    nombre = reserva.cliente.nombre if reserva.cliente else "Cliente"
    cancha = reserva.cancha.nombre if reserva.cancha else ""
    fecha = str(reserva.fecha)
    hora = str(reserva.hora_inicio)[:5]
    return HTMLResponse(_html_ok(nombre, cancha, fecha, hora), status_code=200)

def _base_html(titulo: str, icono: str, color: str, mensaje: str, detalle: str = "") -> str:
    return f"""<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{titulo}</title></head><body style="font-family:sans-serif;padding:20px;text-align:center;"><h1>{icono} {titulo}</h1><p>{mensaje}</p>{detalle}</body></html>"""

def _html_ok(nombre: str, cancha: str, fecha: str, hora: str) -> str:
    return _base_html("Reserva cancelada", "✅", "#22c55e", "Tu reserva ha sido cancelada exitosamente.", f"<p>{nombre} - {cancha} - {fecha} {hora}</p>")

def _html_error(titulo: str, mensaje: str) -> str: return _base_html(titulo, "❌", "#ef4444", mensaje)
def _html_info(titulo: str, mensaje: str) -> str: return _base_html(titulo, "ℹ️", "#3b82f6", mensaje)