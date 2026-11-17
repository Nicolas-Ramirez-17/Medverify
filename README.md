# Medverify

Plataforma para la **validación automatizada de incapacidades médicas** mediante comparación documental con registros simulados de una EPS.
Cliente: Constructora Horizonte S.A.S. · Proyecto académico UMB – Gerencia de Proyectos de Software 2026.

> Prototipo académico: **todos los datos son ficticios**. No hay conexión con EPS reales ni OCR; solo se aceptan certificados en PDF.

## Equipo

| Rol | Integrante |
|---|---|
| Líder de proyecto | Jesús David Mantilla Orozco |
| Backend | Julián David Vaca Casallas |
| Frontend | Nicolás Andrés Ramírez Jarava |
| UX/UI y QA | Luisa Fernanda Salamanca Cely |

## Estado

| Parte | Estado |
|---|---|
| Frontend (React + TypeScript) | ✅ Completo, funcionando con API simulada |
| Contrato de API (`docs/openapi.yaml`) | ✅ Versión 0.9.0 |
| Esquema y datos semilla PostgreSQL | ✅ Probados en PostgreSQL 16 |
| Backend (FastAPI) | ⏳ Por construir → leer **[docs/HANDOFF.md](docs/HANDOFF.md)** |

## Demo en línea

**https://nicolas-ramirez-17.github.io/Medverify/** — usa la API simulada (no necesita backend). Entra con los botones de usuario de prueba.

Se publica sola con GitHub Actions (`.github/workflows/deploy.yml`) cada vez que se sube algo a `main`. Los datos que se creen en la demo viven solo en la pestaña del navegador.

## Arranque rápido

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Entra con un usuario de prueba (botones en la pantalla de inicio de sesión) o con la contraseña `Demo2026*`:
`laura.gomez@horizonte.test` (empleado) · `talentohumano@horizonte.test` (empresa) · `admin@medverify.test` (admin).

Base de datos y correo de pruebas con Docker:

```bash
docker compose up -d db mailpit   # PostgreSQL sembrado + Mailpit en http://localhost:8025
```

## Flujo del sistema

1. **El empleado radica** su incapacidad: datos del certificado + PDF (máx. 5 MB). No se pide diagnóstico.
2. **El sistema valida** contra la base simulada de la EPS: documento, tipo, fechas, días y EPS → *Coincide*, *Con inconsistencias* o *No encontrada*.
3. **Talento Humano recibe un correo** automático.
4. **La empresa aprueba o rechaza** con observaciones; el empleado ve la respuesta. Todo queda en historial y auditoría.

## Estructura

```
frontend/   React 18 + TypeScript + Vite (ver frontend/README.md)
docs/       HANDOFF.md · openapi.yaml · schema.sql · seed.sql
docker-compose.yml
```

## Stack (según el acta de constitución)

React + TypeScript · FastAPI + Python · PostgreSQL · Docker / Docker Compose · Git / GitHub · Mailpit (correo de pruebas).

## Datos personales

Los datos de salud son sensibles (Ley 1581 de 2012). La plataforma pide autorización expresa al registrarse y al radicar, no recolecta diagnósticos, sirve el PDF solo a usuarios autorizados y registra en auditoría cada consulta.
