from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.routers import canchas, clientes, horarios, reservas
from app.seed import run_seed

# Crear todas las tablas si no existen
Base.metadata.create_all(bind=engine)

# Cargar datos semilla
db = SessionLocal()
try:
    run_seed(db)
finally:
    db.close()

app = FastAPI(
    title="Canchas Reservas API",
    description="API REST para reservas de canchas de Fútbol 6 y Pádel",
    version="1.0.0",
)

# CORS – ajustar origins en producción
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(canchas.router,  prefix="/api/canchas",  tags=["Canchas"])
app.include_router(horarios.router, prefix="/api/horarios", tags=["Horarios"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["Clientes"])
app.include_router(reservas.router, prefix="/api/reservas", tags=["Reservas"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Canchas Reservas API"}
