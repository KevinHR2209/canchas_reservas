import uuid
from sqlalchemy import Column, String, Date, Time, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cliente_id = Column(UUID(as_uuid=True), ForeignKey("clientes.id", ondelete="CASCADE"), nullable=False)
    cancha_id = Column(UUID(as_uuid=True), ForeignKey("canchas.id", ondelete="CASCADE"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(String(20), nullable=False, default="confirmada")  # confirmada | completada | cancelada
    notas = Column(Text, nullable=True)
    cancel_token = Column(String(64), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    cliente = relationship("Cliente")
    cancha = relationship("Cancha", back_populates="reservas")
