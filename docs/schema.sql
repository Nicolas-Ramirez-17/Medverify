-- =====================================================================================
-- Medverify · esquema PostgreSQL (propuesta del frontend para el equipo de backend)
-- Coincide con docs/openapi.yaml. Si usan Alembic, esto sirve de referencia para la primera migración.
-- Todos los datos de prueba son ficticios (docs/seed.sql).
-- =====================================================================================

CREATE TABLE empresas (
  id                    SERIAL PRIMARY KEY,
  razon_social          TEXT        NOT NULL,
  nit                   TEXT        NOT NULL UNIQUE,          -- sin puntos: 900000111-2
  ciudad                TEXT        NOT NULL DEFAULT '—',
  email_notificaciones  TEXT        NOT NULL,                 -- aquí llega el correo de cada radicación
  activa                BOOLEAN     NOT NULL DEFAULT TRUE,
  creada_en             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
  id                        SERIAL PRIMARY KEY,
  nombre                    TEXT        NOT NULL,
  documento                 TEXT        NOT NULL CHECK (documento ~ '^\d{6,10}$'),
  email                     TEXT        NOT NULL,
  password_hash             TEXT        NOT NULL,             -- bcrypt / argon2. Nunca texto plano.
  rol                       TEXT        NOT NULL CHECK (rol IN ('empleado','empresa','admin')),
  empresa_id                INTEGER     REFERENCES empresas(id),
  cargo                     TEXT,
  activo                    BOOLEAN     NOT NULL DEFAULT TRUE,
  acepto_tratamiento_datos  TIMESTAMPTZ,                       -- Ley 1581 de 2012: cuándo autorizó
  creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT empresa_segun_rol CHECK ((rol = 'admin') OR (empresa_id IS NOT NULL))
);
CREATE UNIQUE INDEX usuarios_email_unico ON usuarios (lower(email));

-- Base de datos SIMULADA de la EPS (no hay conexión con EPS reales)
CREATE TABLE registros_eps (
  numero           TEXT PRIMARY KEY CHECK (numero ~ '^[A-Z]{2}-\d{4}-\d{6}$'),
  documento        TEXT NOT NULL,
  nombre_paciente  TEXT NOT NULL,
  tipo             TEXT NOT NULL CHECK (tipo IN ('enfermedad_general','licencia_maternidad','licencia_paternidad')),
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL CHECK (fecha_fin >= fecha_inicio),
  dias             INTEGER GENERATED ALWAYS AS (fecha_fin - fecha_inicio + 1) STORED,
  eps              TEXT NOT NULL,
  ips              TEXT NOT NULL
);

CREATE SEQUENCE radicado_seq START 1;

CREATE TABLE solicitudes (
  id                   SERIAL PRIMARY KEY,
  radicado             TEXT        NOT NULL UNIQUE,            -- 'INC-' || año || '-' || lpad(nextval('radicado_seq'),5,'0')
  usuario_id           INTEGER     NOT NULL REFERENCES usuarios(id),
  tipo                 TEXT        NOT NULL CHECK (tipo IN ('enfermedad_general','licencia_maternidad','licencia_paternidad')),
  numero_incapacidad   TEXT        NOT NULL,                   -- guardado en MAYÚSCULAS
  eps                  TEXT        NOT NULL,
  ips                  TEXT        NOT NULL,
  fecha_inicio         DATE        NOT NULL,
  fecha_fin            DATE        NOT NULL CHECK (fecha_fin >= fecha_inicio),
  dias                 INTEGER GENERATED ALWAYS AS (fecha_fin - fecha_inicio + 1) STORED,
  es_prorroga          BOOLEAN     NOT NULL DEFAULT FALSE,
  -- documento PDF (el archivo vive en disco/volumen, fuera de la carpeta pública)
  documento_nombre     TEXT        NOT NULL,                   -- nombre original, solo para mostrar
  documento_ruta       TEXT        NOT NULL,                   -- nombre interno aleatorio (uuid4.pdf)
  documento_tamano     INTEGER     NOT NULL CHECK (documento_tamano <= 5242880),
  documento_sha256     TEXT        NOT NULL,
  estado               TEXT        NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada')),
  observacion          TEXT,
  decidida_por         INTEGER     REFERENCES usuarios(id),
  decidida_en          TIMESTAMPTZ,
  creada_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rechazo_con_motivo CHECK (estado <> 'rechazada' OR length(trim(coalesce(observacion,''))) >= 10),
  CONSTRAINT decision_completa CHECK ((estado = 'pendiente') = (decidida_en IS NULL))
);
-- Un mismo número no puede tener dos solicitudes activas (una rechazada sí se puede volver a radicar)
CREATE UNIQUE INDEX solicitudes_numero_activo ON solicitudes (upper(numero_incapacidad)) WHERE estado <> 'rechazada';
CREATE INDEX solicitudes_usuario ON solicitudes (usuario_id);
CREATE INDEX solicitudes_estado_fecha ON solicitudes (estado, creada_en);

-- Resultado de la validación automática (1 a 1 con la solicitud). Se guarda una "foto" de la comparación:
-- si después alguien edita el registro EPS, la solicitud conserva lo que se comparó en su momento.
CREATE TABLE validaciones (
  solicitud_id         INTEGER     PRIMARY KEY REFERENCES solicitudes(id) ON DELETE CASCADE,
  resultado            TEXT        NOT NULL CHECK (resultado IN ('coincide','inconsistente','no_encontrada')),
  porcentaje           INTEGER     NOT NULL CHECK (porcentaje BETWEEN 0 AND 100),
  campos               JSONB       NOT NULL DEFAULT '[]',      -- [{campo, etiqueta, valor_radicado, valor_eps, coincide}]
  registro_eps_numero  TEXT,
  registro_eps_ips     TEXT,
  validado_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE historial (
  id            SERIAL PRIMARY KEY,
  solicitud_id  INTEGER     NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
  fecha         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor         TEXT        NOT NULL,                          -- nombre del usuario o 'Sistema'
  accion        TEXT        NOT NULL,
  detalle       TEXT        NOT NULL DEFAULT ''
);
CREATE INDEX historial_solicitud ON historial (solicitud_id, fecha);

CREATE TABLE correos (
  id            SERIAL PRIMARY KEY,
  solicitud_id  INTEGER     NOT NULL REFERENCES solicitudes(id),
  para          TEXT        NOT NULL,
  asunto        TEXT        NOT NULL,
  enviado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  estado        TEXT        NOT NULL CHECK (estado IN ('enviado','fallido')),
  error         TEXT                                           -- mensaje técnico si falló (no se expone en la API)
);

-- Notificaciones de la campana. usuario_id → para un empleado; empresa_id → para RR. HH. de esa empresa.
CREATE TABLE notificaciones (
  id            SERIAL PRIMARY KEY,
  usuario_id    INTEGER     REFERENCES usuarios(id),
  empresa_id    INTEGER     REFERENCES empresas(id),
  solicitud_id  INTEGER     REFERENCES solicitudes(id),
  mensaje       TEXT        NOT NULL,
  leida         BOOLEAN     NOT NULL DEFAULT FALSE,
  creada_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT un_destino CHECK ((usuario_id IS NULL) <> (empresa_id IS NULL))
);

CREATE TABLE auditoria (
  id              BIGSERIAL PRIMARY KEY,
  fecha           TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id      INTEGER     REFERENCES usuarios(id),
  usuario_nombre  TEXT        NOT NULL,                        -- copia: el registro no cambia si renombran al usuario
  rol             TEXT        NOT NULL CHECK (rol IN ('empleado','empresa','admin','sistema')),
  accion          TEXT        NOT NULL,
  objeto          TEXT        NOT NULL DEFAULT '',
  ip              TEXT        NOT NULL DEFAULT ''
);
CREATE INDEX auditoria_fecha ON auditoria (fecha DESC);
