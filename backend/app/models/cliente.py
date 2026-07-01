import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    telefono = Column(String(20), nullable=False)
    comuna = Column(String(100), nullable=False)
    activo = Column(Boolean, server_default='true', default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
