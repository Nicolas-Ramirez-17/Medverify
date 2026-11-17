# Medverify · Entrega del frontend al equipo de backend

> **Para:** Julián David Vaca Casallas (Backend)
> **De:** Frontend (Nicolás Andrés Ramírez Jarava) · revisión UX/QA: Luisa Fernanda Salamanca Cely · líder: Jesús David Mantilla Orozco
> **Estado:** frontend completo contra una API simulada. Falta la API real (FastAPI + PostgreSQL + correo).
> **Fecha:** 16 nov 2026 · versión del contrato 0.9.0

Este documento dice **exactamente** qué tiene que construir el backend para que el frontend funcione sin tocarle una línea. El contrato formal está en [`openapi.yaml`](openapi.yaml); aquí están las reglas de negocio, los permisos y los criterios para dar algo por terminado.

---

## 0. Qué hay en el repositorio

```
medverify/
├── frontend/                 React 18 + TypeScript + Vite (listo)
│   └── src/api/
│       ├── types.ts          tipos del contrato (espejo de openapi.yaml)
│       ├── http.ts           cliente real: fetch a VITE_API_URL  ← lo que llamará tu API
│       ├── mock/mockApi.ts   servidor simulado con las MISMAS reglas (sirve de especificación ejecutable)
│       └── mock/seed.ts      datos ficticios de prueba
├── docs/
│   ├── HANDOFF.md            este documento
│   ├── openapi.yaml          contrato de la API (fuente de verdad)
│   ├── schema.sql            esquema PostgreSQL propuesto (probado en PostgreSQL 16)
│   └── seed.sql              mismos datos del modo simulado, con contraseñas en bcrypt
└── docker-compose.yml        db + mailpit + web (+ api cuando exista)
```

**Truco útil:** `frontend/src/api/mock/mockApi.ts` es la especificación ejecutable. Cada método corresponde a un endpoint y ya aplica los permisos, los códigos de error y las validaciones que se esperan del backend. Si hay duda sobre un caso, ese archivo es la respuesta (y si no lo es, lo hablamos y actualizamos el contrato).

---

## 1. Cómo correr el frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 con la API simulada
```

Usuarios de prueba (contraseña **`Demo2026*`**):

| Rol | Correo | Persona ficticia |
|---|---|---|
| Empleado | `laura.gomez@horizonte.test` | Laura Gómez Pardo |
| Empresa (RR. HH.) | `talentohumano@horizonte.test` | María José Aristizábal |
| Empresa (RR. HH.) | `nomina@horizonte.test` | Andrés Camilo Torres |
| Administrador | `admin@medverify.test` | Julián Vaca Casallas |
| Empleado **desactivado** | `paola.mendez@horizonte.test` | sirve para probar el 403 |

### Conectarlo a tu API

```bash
cp .env.example .env.local
# en .env.local:
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

La banda superior de la app dice **«API simulada»** o **«API real»** para que nunca haya duda de contra qué se está probando.

---

## 2. División del trabajo

| Tema | Frontend (hecho) | Backend (por hacer) |
|---|---|---|
| Validaciones de formulario | Inmediatas, para orientar al usuario | **Las que cuentan.** Repetir todas: el front se puede saltar |
| Permisos por rol | Oculta menús y rutas | **Obligatorio en cada endpoint** (ver §3) |
| PDF | Revisa extensión, tamaño y firma `%PDF-` antes de subir | Revisar de nuevo, guardar fuera de lo público, servir solo a autorizados |
| Validación contra la EPS | Muestra el resultado | **Calcularla** (§4) y guardarla |
| Correo a RR. HH. | Muestra el registro de envíos | Enviar por SMTP (Mailpit en desarrollo) y registrar |
| Notificaciones, historial, auditoría | Los muestra | Generarlos en cada evento (§8) |
| Paneles e indicadores | Gráficos y tarjetas | Calcular los números (definiciones en openapi.yaml) |

---

## 3. Endpoints y permisos

Base: `/api/v1`. Todo con `Authorization: Bearer <JWT>` salvo lo marcado como público.

| Método | Ruta | Empleado | Empresa | Admin | Notas |
|---|---|:-:|:-:|:-:|---|
| POST | `/auth/login` | público | | | 401 genérico; 403 si la cuenta está desactivada |
| POST | `/auth/registro/empleado` | público | | | 201 + token |
| POST | `/auth/registro/empresa` | público | | | crea empresa + usuario rol empresa |
| GET | `/auth/me` | ✔ | ✔ | ✔ | el front lo llama al abrir la app |
| PUT | `/auth/password` | ✔ | ✔ | ✔ | 204 |
| PATCH | `/usuarios/me` | ✔ | ✔ | ✔ | solo `nombre` y `cargo` |
| GET | `/empresas/publicas` | público | | | solo activas, solo id y razón social |
| GET | `/paneles/empleado` | ✔ | | | |
| GET | `/paneles/empresa` | | ✔ (su empresa) | ✔ (todo) | |
| GET | `/paneles/admin` | | | ✔ | |
| GET | `/solicitudes` | propias | su empresa | todas | empleado: `resultado_validacion = null` |
| POST | `/solicitudes` | ✔ | | | multipart; §4 y §5 |
| GET | `/solicitudes/{id}` | propia | su empresa | todas | empleado: `validacion = null`; fuera de alcance → **404** |
| PATCH | `/solicitudes/{id}/decision` | | ✔ (su empresa) | | 409 si ya no está pendiente |
| GET | `/solicitudes/{id}/documento` | propia | su empresa | todas | `application/pdf` |
| GET | `/notificaciones` | ✔ | ✔ | ✔ | máx. 20, recientes primero |
| POST | `/notificaciones/marcar-leidas` | ✔ | ✔ | ✔ | 204 |
| GET | `/correos` | | su empresa | todos | |
| GET/POST | `/usuarios` | | | ✔ | |
| PATCH | `/usuarios/{id}` | | | ✔ | no puede cambiar su propio rol ni desactivarse (400) |
| GET/POST | `/empresas` | | | ✔ | |
| GET/POST | `/eps/registros` | | | ✔ | |
| PUT/DELETE | `/eps/registros/{numero}` | | | ✔ | |
| GET | `/auditoria` | | | ✔ | paginado |
| GET | `/sistema/estado` | | | ✔ | |

**Decisión de diseño:** el administrador puede *ver* todas las solicitudes pero **no** aprobarlas ni rechazarlas; esa decisión es de Talento Humano de cada empresa.

---

## 4. Regla de validación contra la EPS simulada (el corazón del proyecto)

Se ejecuta al radicar, dentro de la misma transacción, y su resultado se guarda (tabla `validaciones`).

1. Buscar en `registros_eps` el registro cuyo `numero` sea igual a `numero_incapacidad` **sin distinguir mayúsculas**.
2. Si no existe → `resultado = "no_encontrada"`, `porcentaje = 0`, `campos = []`.
3. Si existe, comparar **6 campos**, en este orden, quitando espacios a los extremos y sin distinguir mayúsculas:

   | campo | etiqueta | valor radicado | valor EPS |
   |---|---|---|---|
   | `documento` | Documento del empleado | `usuarios.documento` del que radica (no viene del formulario) | `registros_eps.documento` |
   | `tipo` | Tipo de incapacidad | etiqueta legible del tipo radicado | etiqueta legible del tipo EPS |
   | `fecha_inicio` | Fecha de inicio | `YYYY-MM-DD` | `YYYY-MM-DD` |
   | `fecha_fin` | Fecha de finalización | `YYYY-MM-DD` | `YYYY-MM-DD` |
   | `dias` | Días de incapacidad | días calculados (ver abajo) | `registros_eps.dias` |
   | `eps` | EPS | texto | texto |

4. Todos coinciden → `"coincide"`; alguno no → `"inconsistente"`.
5. `porcentaje = round(coincidencias / 6 × 100)` (entero: 6/6 = 100, 5/6 = 83, 4/6 = 67).

**Días:** días calendario con ambos extremos incluidos: `(fecha_fin − fecha_inicio) + 1`. Del 14 al 16 de septiembre = 3 días.

**Etiquetas de tipo:** `enfermedad_general` → «Enfermedad general», `licencia_maternidad` → «Licencia de maternidad», `licencia_paternidad` → «Licencia de paternidad».

Implementación de referencia en Python (equivalente a `validarContraEps` en `frontend/src/lib/reglas.ts`):

```python
TIPO_LABEL = {
    "enfermedad_general": "Enfermedad general",
    "licencia_maternidad": "Licencia de maternidad",
    "licencia_paternidad": "Licencia de paternidad",
}

def dias_entre(inicio: date, fin: date) -> int:
    return (fin - inicio).days + 1

def validar_contra_eps(documento: str, tipo: str, fecha_inicio: date, fecha_fin: date,
                       eps: str, registro: RegistroEps | None, ahora: datetime) -> dict:
    if registro is None:
        return {"resultado": "no_encontrada", "porcentaje": 0, "campos": [],
                "registro_eps_numero": None, "registro_eps_ips": None, "validado_en": ahora}
    filas = [
        ("documento", "Documento del empleado", documento, registro.documento),
        ("tipo", "Tipo de incapacidad", TIPO_LABEL[tipo], TIPO_LABEL[registro.tipo]),
        ("fecha_inicio", "Fecha de inicio", fecha_inicio.isoformat(), registro.fecha_inicio.isoformat()),
        ("fecha_fin", "Fecha de finalización", fecha_fin.isoformat(), registro.fecha_fin.isoformat()),
        ("dias", "Días de incapacidad", str(dias_entre(fecha_inicio, fecha_fin)), str(registro.dias)),
        ("eps", "EPS", eps, registro.eps),
    ]
    norm = lambda v: v.strip().lower()
    campos = [{"campo": c, "etiqueta": e, "valor_radicado": r, "valor_eps": v, "coincide": norm(r) == norm(v)}
              for c, e, r, v in filas]
    ok = sum(c["coincide"] for c in campos)
    return {"resultado": "coincide" if ok == len(campos) else "inconsistente",
            "porcentaje": round(ok / len(campos) * 100), "campos": campos,
            "registro_eps_numero": registro.numero, "registro_eps_ips": registro.ips, "validado_en": ahora}
```

> La validación **no aprueba ni rechaza** nada: solo informa a Talento Humano. La decisión siempre es humana.

### Casos de prueba que ya vienen en `seed.sql` (úsalos en pytest)

| Radicado | Situación | Resultado esperado |
|---|---|---|
| INC-2026-00131 | todo coincide | `coincide`, 100 |
| INC-2026-00140 | fecha fin 9 oct vs 8 oct en la EPS → también cambian los días | `inconsistente`, 67 |
| INC-2026-00154 | EPS radicada distinta a la del registro | `inconsistente`, 83 |
| INC-2026-00156 | número `EG-2026-109999` no existe | `no_encontrada`, 0 |
| (nueva) Laura con `EG-2026-109640` | registro libre para probar una radicación que coincide | `coincide`, 100 |

### Otras reglas de la radicación

- `numero_incapacidad`: se guarda en mayúsculas y debe cumplir `^[A-Z]{2}-\d{4}-\d{6}$`.
- **No puede haber dos solicitudes no rechazadas con el mismo número** → 409 (`loc: ["body","numero_incapacidad"]`). Una rechazada sí se puede volver a radicar. (Índice único parcial en `schema.sql`).
- `fecha_fin >= fecha_inicio`; `ips` mínimo 4 caracteres; `eps` de la lista `EPS Simulada Andina | EPS Simulada Caribe | EPS Simulada Pacífico`.
- Radicado: `INC-<año>-<consecutivo de 5 dígitos>` con la secuencia `radicado_seq` (tras la semilla, el siguiente es `INC-2026-00158`).
- Estado inicial: `pendiente`.
- **No se pide ni se guarda diagnóstico** (minimización de datos, Ley 1581 de 2012: los datos de salud son sensibles).

### Decisión (aprobar / rechazar)

- Solo rol empresa, solo solicitudes de empleados de su empresa, solo si está `pendiente` (si no → 409 «Esta solicitud ya fue decidida.»).
- Rechazo exige `observacion` de al menos 10 caracteres (422, `loc: ["body","observacion"]`). En aprobación es opcional.
- Guarda `decidida_por`, `decidida_en`, agrega historial, auditoría y una notificación al empleado: «Tu solicitud INC-… fue aprobada|rechazada».

---

## 5. El PDF

- Solo PDF: revisar que los primeros 5 bytes sean `%PDF-` (no confiar en la extensión ni en el `Content-Type`). Si no → **415**.
- Máximo **5 MB** → si no, **413**. Configurar también el límite en el servidor web/proxy.
- Guardarlo con un nombre interno aleatorio (`uuid4().hex + ".pdf"`) en un volumen fuera de cualquier carpeta pública. Guardar `documento_nombre` (original, para mostrar), `documento_tamano` y `documento_sha256`.
- `GET /solicitudes/{id}/documento` aplica el mismo control de acceso que el detalle y responde `Content-Type: application/pdf` y `Content-Disposition: inline; filename="…"`. El front lo pide con el token (fetch → blob), así que **no** hace falta URL firmada.
- Sin OCR: el contenido del PDF no se lee (alcance del acta).

---

## 6. Autenticación, CORS y seguridad

- `POST /auth/login` devuelve `{access_token, token_type: "bearer", usuario}`. JWT HS256 con `sub = usuario.id`, `rol`, `exp` (sugerido 8 h). Secreto en variable de entorno.
- Contraseñas con **bcrypt** (`passlib[bcrypt]`) — el hash de `seed.sql` es bcrypt costo 12. Política: mínimo 8 caracteres, una mayúscula y un número.
- Usuario desactivado: login → 403 y cualquier endpoint con su token → 403.
- 401 en cualquier endpoint → el front borra el token y manda al login. Usar el mensaje «Tu sesión expiró. Inicia sesión de nuevo.».
- CORS: permitir `http://localhost:5173` (dev) y el dominio de producción; métodos `GET, POST, PUT, PATCH, DELETE`; cabecera `Authorization`.
- Fuera de alcance → **404** (no 403) en recursos de otra persona, para no revelar que existen.
- El front guarda el token en `sessionStorage` (se borra al cerrar la pestaña). *Abierto a discusión:* cookie `httpOnly` + `SameSite=Strict` protege mejor contra XSS; si la implementas, el cambio en el front es pequeño (`http.ts`).

---

## 7. Correo a Talento Humano (Mailpit en desarrollo)

Al radicar, después del commit, enviar a `empresas.email_notificaciones`:

- **De:** `Medverify <no-responder@medverify.test>`
- **Asunto:** `Nueva incapacidad radicada · INC-2026-00158`
- **Cuerpo (HTML + texto):** saludo a Talento Humano; nombre del empleado; radicado; tipo; periodo y días; resultado de la validación EPS; enlace `http://localhost:5173/solicitudes/{id}`; «Este es un mensaje automático. No responda a este correo.» **Sin** diagnóstico ni el PDF adjunto.
- Registrar cada envío en `correos` con `estado = enviado | fallido`. Un fallo de correo **no** revierte la radicación.
- Desarrollo: SMTP `mailpit:1025`, bandeja en <http://localhost:8025>. La pantalla «Correos de notificación» del front lee `GET /correos`, no Mailpit.

---

## 8. Eventos que generan historial, notificación y auditoría

| Evento | Historial de la solicitud | Notificación | Auditoría (acción) |
|---|---|---|---|
| Inicio de sesión | | | «Inicio de sesión» |
| Registro | | | «Registro de cuenta» / «Registro de empresa» |
| Radicación | «Radicó la solicitud» (actor: empleado; detalle: «Adjuntó archivo.pdf») | a la empresa: «{nombre} radicó INC-…» | «Radicación de incapacidad» |
| Validación | «Validación automática» (actor: Sistema; detalle: «Coincide con la EPS (100 % de coincidencia)») | | |
| Correo enviado | «Notificación por correo enviada» (detalle: «A correo@…») | | |
| Decisión | «Aprobó/Rechazó la solicitud» (detalle: observación o «Sin observaciones») | al empleado | «Aprobación/Rechazo de solicitud» |
| Consulta del detalle por empresa/admin | | | «Consulta de solicitud y PDF» |
| Cambios de admin | | | «Creación de usuario», «Cambio de rol», «Activación/Desactivación de usuario», «Registro de empresa», «Creación/Edición/Eliminación de registro EPS» |
| Cambio de contraseña / perfil | | | «Cambio de contraseña», «Actualización de perfil» |

Guardar también la IP del cliente en auditoría (`request.client.host`, o `X-Forwarded-For` detrás del proxy).

---

## 9. Base de datos

```bash
psql -d medverify -f docs/schema.sql
psql -d medverify -f docs/seed.sql
```

Ambos archivos se probaron en PostgreSQL 16. El `docker-compose.yml` los carga solos la primera vez que se crea el volumen de la base. Si prefieres SQLAlchemy + Alembic, usa `schema.sql` como referencia para la migración inicial; lo importante es que la **forma del JSON** de la API sea la de `openapi.yaml`.

Las solicitudes semilla no tienen PDF real (`documento_ruta = seed/INC-….pdf`). Para ellas puedes generar un PDF de prueba al arrancar o responder 404 en `/documento`; el front muestra entonces una hoja de certificado simulada.

---

## 10. Criterios de aceptación (cómo sé que el backend está listo)

Se prueban con el front en `VITE_USE_MOCK=false` y la base sembrada:

- [ ] Login con los 4 usuarios de prueba lleva a su panel; contraseña errada → «Correo o contraseña incorrectos.»; Paola → mensaje de cuenta desactivada.
- [ ] Recargar la página mantiene la sesión (`/auth/me`).
- [ ] Laura radica `EG-2026-109640` (16–18 nov 2026, EPS Simulada Andina, IPS Clínica del Norte) con un PDF → recibe `INC-2026-00158`, la ve **Pendiente** y **no** ve el resultado de la validación.
- [ ] Volver a radicar `EG-2026-109640` → error en el campo número (409).
- [ ] Subir un `.png` renombrado a `.pdf` → 415; un PDF de 6 MB → 413. (Probar con `curl` o pytest: el front los bloquea antes de enviarlos, pero la API no puede confiar en eso.)
- [ ] Llega el correo a Mailpit (`talentohumano@horizonte.test`) y aparece en «Correos de notificación».
- [ ] María José ve la solicitud con validación **Coincide 100 %**, el PDF se abre en el visor y puede aprobar. Rechazar sin motivo → error en el campo observación.
- [ ] Laura ve la decisión, la observación y la notificación en la campana.
- [ ] Un empleado que pide `/solicitudes/{id}` de otro → 404. Un empleado que llama `/usuarios` → 403.
- [ ] Panel de empresa: los números coinciden con la tabla (8 semanas, % por validación, horas promedio).
- [ ] Admin: crear usuario, cambiar rol, desactivar, CRUD de registros EPS, auditoría con búsqueda y paginación, estado del sistema.
- [ ] `pytest` cubre la regla del §4 con los casos de la tabla.

## 11. Definición de terminado y flujo de trabajo

- Rama `main` protegida. Una rama por historia: `feature/api-auth`, `feature/api-solicitudes`, … Pull request con al menos una revisión (QA: Luisa).
- Commits en español y en imperativo: «Agrega endpoint de decisión», «Corrige cálculo de días».
- Un endpoint está **terminado** cuando: cumple `openapi.yaml`, tiene pruebas, valida el rol, registra auditoría si aplica y el flujo correspondiente pasa en el front con `VITE_USE_MOCK=false`.
- **Cambios al contrato:** primero PR a `docs/openapi.yaml` + `frontend/src/api/types.ts`; se avisa en el grupo; luego se implementa. Nadie cambia el JSON «por debajo».
- FastAPI publica su propio OpenAPI en `/docs`: compáralo con `docs/openapi.yaml` antes de cada entrega.

## 12. Preguntas abiertas para la reunión de equipo

1. **Rol administrador:** el acta (Restricciones) habla de dos tipos de usuario (Empleado y Empresa), pero los interesados incluyen un Administrador. El front implementa los tres. ¿Lo confirmamos con la patrocinadora y ajustamos el acta?
2. ¿Token en `sessionStorage` o cookie `httpOnly`? (§6)
3. ¿Se permite que el empleado **cancele** una solicitud pendiente? Hoy no existe ese endpoint.
4. Si el admin corrige un registro EPS, ¿se re-validan las solicitudes **pendientes** con ese número? Hoy no (se conserva la foto de la validación original).
5. Plazo de radicación: el front muestra «2 días hábiles» como política de ejemplo. ¿Lo valida el backend o queda informativo?
