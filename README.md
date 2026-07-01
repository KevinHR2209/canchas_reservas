# 🏟️ Canchas Reservas

Sistema de reservas para **canchas de fútbol 6 y pádel** — construido con FastAPI, PostgreSQL y Docker.

## 🚀 Tecnologías

- **Backend**: Python 3.11 + FastAPI
- **Base de datos**: PostgreSQL 15
- **ORM**: SQLAlchemy 2
- **Contenedores**: Docker + Docker Compose
- **Correo**: SMTP Gmail (confirmación + cancelación)

## 📦 Estructura

```
canchas_reservas/
├── backend/          # API FastAPI
│   └── app/
│       ├── models/   # Modelos SQLAlchemy
│       ├── schemas/  # Schemas Pydantic
│       ├── routers/  # Endpoints REST
│       └── services/ # Lógica de negocio
├── database/
├── docker-compose.yml
└── init.sql
```

## ▶️ Inicio rápido

```bash
cp .env.example .env
cp backend/.env.example backend/.env
docker compose up --build
```

API disponible en `http://localhost:8001`  
Docs interactivos en `http://localhost:8001/docs`

## ✅ Funcionalidades

- Reserva de canchas con validación de disponibilidad en tiempo real
- Confirmación automática por email al reservar
- Cancelación por token seguro (enlace en el correo, sin login)
- Estados: `confirmada`, `completada`, `cancelada`
- Seed automático con canchas, horarios y datos de ejemplo
