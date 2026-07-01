import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


TIPO_CANCHA = ("futbol6", "padel")


class Cancha(Base):
    __tablename__ = "canchas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False, unique=True)
    tipo = Column(String(20), nullable=False)  # futbol6 | padel
    descripcion = Column(Text, nullable=True)
    activa = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    horarios = relationship("HorarioCancha", back_populates="cancha", cascade="all, delete")
    reservas = relationship("Reserva", back_populates="cancha")
