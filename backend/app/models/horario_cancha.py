import uuid
from sqlalchemy import Column, Integer, Time, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


class HorarioCancha(Base):
    __tablename__ = "horarios_cancha"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cancha_id = Column(UUID(as_uuid=True), ForeignKey("canchas.id", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=Lunes ... 6=Domingo
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    activo = Column(Boolean, default=True)

    cancha = relationship("Cancha", back_populates="horarios")

    __table_args__ = (UniqueConstraint("cancha_id", "dia_semana"),)
