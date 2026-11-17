# Medverify Backend (FastAPI)

API REST de Medverify implementada con **FastAPI + SQLAlchemy 2 + PostgreSQL 16** siguiendo el contrato de [`docs/openapi.yaml`](../docs/openapi.yaml) y [`docs/HANDOFF.md`](../docs/HANDOFF.md).

## Arranque local (desarrollo / pruebas)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\pytest.exe -v
```

Para iniciar el servidor contra PostgreSQL:

```powershell
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

La documentación OpenAPI interactiva queda disponible en `http://localhost:8000/docs`.

## Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `DATABASE_URL` | `postgresql+psycopg://medverify:medverify_dev@localhost:5432/medverify` | Cadena de conexión a PostgreSQL 16 |
| `JWT_SECRET` | valor de desarrollo | Secreto HS256 para firmar tokens |
| `JWT_EXPIRE_MINUTES` | `480` | Duración de sesión (8 h) |
| `SMTP_HOST` / `SMTP_PORT` | `localhost` / `1025` | Servidor SMTP (Mailpit en Docker) |
| `PDF_DIR` | `./data/pdf` | Carpeta privada donde se guardan los PDF |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:8080` | Orígenes permitidos |
| `FRONTEND_URL` | `http://localhost:5173` | URL base para enlaces en correos |
