from sqlalchemy.orm import Session
from .models.cancha import Cancha
from .models.horario_cancha import HorarioCancha


def run_seed(db: Session):
    # Canchas de fútbol 6 y pádel
    if db.query(Cancha).count() == 0:
        canchas_data = [
            dict(nombre="Cancha Fútbol 6 - A", tipo="futbol6", descripcion="Cancha de césped sintético, iluminación LED.", activa=True),
            dict(nombre="Cancha Fútbol 6 - B", tipo="futbol6", descripcion="Cancha de césped sintético, techada.",           activa=True),
            dict(nombre="Cancha Fútbol 6 - C", tipo="futbol6", descripcion="Cancha exterior, piso de caucho.",                activa=True),
            dict(nombre="Cancha Pádel - 1",    tipo="padel",   descripcion="Cancha de pádel cristal, iluminada.",             activa=True),
            dict(nombre="Cancha Pádel - 2",    tipo="padel",   descripcion="Cancha de pádel techada, superficie rápida.",     activa=True),
        ]
        for cd in canchas_data:
            db.add(Cancha(**cd))
        db.commit()

    # Horarios Lunes(0) a Domingo(6) para todas las canchas
    if db.query(HorarioCancha).count() == 0:
        canchas = db.query(Cancha).all()
        for c in canchas:
            for dia in range(7):
                db.add(HorarioCancha(
                    cancha_id=c.id,
                    dia_semana=dia,
                    hora_inicio="08:00:00",
                    hora_fin="23:00:00",
                    activo=True,
                ))
        db.commit()

    print("[SEED] Datos iniciales cargados correctamente.")
