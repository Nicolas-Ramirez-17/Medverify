from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import admin, auth, notificaciones, paneles, solicitudes

app = FastAPI(
    title='Medverify API',
    version=settings.app_version,
    summary='API REST de Medverify para validación automatizada de incapacidades médicas.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allow_headers=['Authorization', 'Content-Type', 'Accept'],
)

PREFIX = '/api/v1'
app.include_router(auth.router, prefix=PREFIX)
app.include_router(paneles.router, prefix=PREFIX)
app.include_router(solicitudes.router, prefix=PREFIX)
app.include_router(notificaciones.router, prefix=PREFIX)
app.include_router(admin.router, prefix=PREFIX)


@app.get('/salud')
def salud():
    return {'ok': True, 'version': settings.app_version}
