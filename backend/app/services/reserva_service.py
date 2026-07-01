import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.reserva import Reserva
from app.models.cancha import Cancha
from app.models.cliente import Cliente
from app.models.horario_cancha import HorarioCancha
from app.schemas.reserva import ReservaCreate
from app.services.email_service import enviar_confirmacion

DURACION_BLOQUE_MINUTOS = 60  # bloques fijos de 1 hora


def crear_reserva(db: Session, data: ReservaCreate) -> Reserva:
    # 1. Verificar cancha activa
    cancha = db.query(Cancha).filter(
        Cancha.id == data.cancha_id,
        Cancha.activa == True
    ).first()
    if not cancha:
        raise HTTPException(status_code=404, detail="Cancha no encontrada o inactiva")

    # 2. Verificar cliente existente y activo
    cliente = db.query(Cliente).filter(
        Cliente.id == data.cliente_id,
        Cliente.activo == True
    ).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado o inactivo")

    # 3. Verificar que la cancha atiende ese día de la semana
    dia_semana = data.fecha.weekday()  # 0=Lunes ... 6=Domingo
    horario = db.query(HorarioCancha).filter(
        HorarioCancha.cancha_id == data.cancha_id,
        HorarioCancha.dia_semana == dia_semana,
        HorarioCancha.activo == True,
    ).first()
    if not horario:
        raise HTTPException(
            status_code=400,
            detail=f"La cancha no está disponible ese día (día {dia_semana}, 0=Lunes)"
        )

    # 4. Calcular hora de fin (bloques fijos de 60 minutos)
    hora_inicio = data.hora_inicio
    hora_fin = (
        datetime.combine(data.fecha, hora_inicio) + timedelta(minutes=DURACION_BLOQUE_MINUTOS)
    ).time()

    # 5. Verificar que el bloque está dentro del horario de operación
    if hora_inicio < horario.hora_inicio or hora_fin > horario.hora_fin:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Hora fuera del horario de la cancha. "
                f"Atiende de {horario.hora_inicio.strftime('%H:%M')} "
                f"a {horario.hora_fin.strftime('%H:%M')}"
            )
        )

    # 6. Verificar conflicto de reserva en la misma cancha y horario
    conflicto = db.query(Reserva).filter(
        Reserva.cancha_id == data.cancha_id,
        Reserva.fecha == data.fecha,
        Reserva.estado != "cancelada",
        Reserva.hora_inicio < hora_fin,
        Reserva.hora_fin > hora_inicio,
    ).first()
    if conflicto:
        raise HTTPException(
            status_code=409,
            detail="Ya existe una reserva en esa cancha para ese horario"
        )

    # 7. Generar token único para cancelación
    cancel_token = secrets.token_urlsafe(32)

    # 8. Crear la reserva
    reserva = Reserva(
        cliente_id=data.cliente_id,
        cancha_id=data.cancha_id,
        fecha=data.fecha,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        notas=data.notas,
        cancel_token=cancel_token,
    )
    db.add(reserva)
    db.commit()
    db.refresh(reserva)

    # 9. Enviar email de confirmación (no bloquea la respuesta)
    try:
        if cliente.email:
            enviar_confirmacion(cliente.email, {
                "cliente_nombre": cliente.nombre,
                "cancha_nombre": cancha.nombre,
                "cancha_tipo": cancha.tipo,
                "fecha": str(data.fecha),
                "hora_inicio": str(hora_inicio)[:5],
                "hora_fin": str(hora_fin)[:5],
                "cancel_token": cancel_token,
            })
    except Exception as e:
        print(f"[EMAIL] Error al preparar envío: {e}")

    return reserva
