from datetime import date, datetime, timezone
from fastapi.testclient import TestClient
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.db import Base, get_db
from app.main import app
from app.models import Empresa, Historial, RegistroEps, Solicitud, Usuario, Validacion
from app.validation import validar_contra_eps

# Hash bcrypt real de "Demo2026*" (el mismo de docs/seed.sql)
HASH_DEMO = '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W'


@pytest.fixture()
def correos_enviados(monkeypatch):
    enviados: list[dict] = []

    def _fake_smtp(para: str, asunto: str, texto: str, html: str | None = None) -> None:
        enviados.append({'para': para, 'asunto': asunto, 'texto': texto, 'html': html})

    monkeypatch.setattr('app.email_service.enviar_smtp', _fake_smtp)
    return enviados


@pytest.fixture()
def client(tmp_path, correos_enviados, monkeypatch):
    monkeypatch.setattr(settings, 'pdf_dir', tmp_path / 'pdf')

    engine = create_engine(
        'sqlite:///:memory:',
        connect_args={'check_same_thread': False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    Base.metadata.create_all(bind=engine)

    with TestingSession() as db:
        _sembrar(db)

    def _override_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_db
    with TestClient(app) as tc:
        yield tc
    app.dependency_overrides.clear()


def _sembrar(db) -> None:
    ahora = datetime(2026, 9, 1, 13, 0, tzinfo=timezone.utc)
    db.add_all([
        Empresa(id=1, razon_social='Constructora Horizonte S.A.S.', nit='900000111-2', ciudad='Bogotá D.C.', email_notificaciones='talentohumano@horizonte.test', activa=True, creada_en=ahora),
        Empresa(id=2, razon_social='Empresa Demo Ingeniería S.A.S.', nit='900000222-3', ciudad='Medellín', email_notificaciones='rrhh@demo-ingenieria.test', activa=False, creada_en=ahora),
    ])
    db.flush()

    db.add_all([
        Usuario(id=1, nombre='Laura Gómez Pardo', documento='1023456789', email='laura.gomez@horizonte.test', password_hash=HASH_DEMO, rol='empleado', empresa_id=1, cargo='Residente de obra', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=3, nombre='Diana Marcela Ruiz', documento='1015987654', email='diana.ruiz@horizonte.test', password_hash=HASH_DEMO, rol='empleado', empresa_id=1, cargo='Auxiliar contable', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=4, nombre='Jorge Iván Castillo', documento='79876543', email='jorge.castillo@horizonte.test', password_hash=HASH_DEMO, rol='empleado', empresa_id=1, cargo='Operador de maquinaria', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=6, nombre='Sebastián Ortiz Lara', documento='1018555444', email='sebastian.ortiz@horizonte.test', password_hash=HASH_DEMO, rol='empleado', empresa_id=1, cargo='Topógrafo', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=7, nombre='Paola Andrea Méndez', documento='52777888', email='paola.mendez@horizonte.test', password_hash=HASH_DEMO, rol='empleado', empresa_id=1, cargo='Almacenista', activo=False, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=8, nombre='María José Aristizábal', documento='52123987', email='talentohumano@horizonte.test', password_hash=HASH_DEMO, rol='empresa', empresa_id=1, cargo='Directora de Talento Humano', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
        Usuario(id=10, nombre='Julián Vaca Casallas', documento='1001222333', email='admin@medverify.test', password_hash=HASH_DEMO, rol='admin', empresa_id=None, cargo='Administrador de la plataforma', activo=True, acepto_tratamiento_datos=ahora, creado_en=ahora),
    ])

    regs = [
        RegistroEps(numero='EG-2026-104521', documento='1023456789', nombre_paciente='Laura Gómez Pardo', tipo='enfermedad_general', fecha_inicio=date(2026, 9, 14), fecha_fin=date(2026, 9, 16), dias=3, eps='EPS Simulada Andina', ips='IPS Clínica del Norte'),
        RegistroEps(numero='EG-2026-105902', documento='1015987654', nombre_paciente='Diana Marcela Ruiz', tipo='enfermedad_general', fecha_inicio=date(2026, 10, 6), fecha_fin=date(2026, 10, 8), dias=3, eps='EPS Simulada Pacífico', ips='IPS Centro Médico Chapinero'),
        RegistroEps(numero='EG-2026-108911', documento='79876543', nombre_paciente='Jorge Iván Castillo', tipo='enfermedad_general', fecha_inicio=date(2026, 11, 10), fecha_fin=date(2026, 11, 14), dias=5, eps='EPS Simulada Caribe', ips='IPS Salud Calle 80'),
        RegistroEps(numero='EG-2026-109640', documento='1023456789', nombre_paciente='Laura Gómez Pardo', tipo='enfermedad_general', fecha_inicio=date(2026, 11, 16), fecha_fin=date(2026, 11, 18), dias=3, eps='EPS Simulada Andina', ips='IPS Clínica del Norte'),
    ]
    db.add_all(regs)
    db.flush()

    reg_map = {r.numero: r for r in regs}
    semillas = [
        (1, 'INC-2026-00131', 1, '1023456789', 'EG-2026-104521', 'EPS Simulada Andina', 'IPS Clínica del Norte', date(2026, 9, 14), date(2026, 9, 16), 3, 'aprobada', 'Soporte completo.', 8, datetime(2026, 9, 17, 15, 5, tzinfo=timezone.utc), datetime(2026, 9, 16, 13, 10, tzinfo=timezone.utc)),
        (4, 'INC-2026-00140', 3, '1015987654', 'EG-2026-105902', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero', date(2026, 10, 6), date(2026, 10, 9), 4, 'rechazada', 'La fecha final no coincide.', 8, datetime(2026, 10, 8, 18, 28, tzinfo=timezone.utc), datetime(2026, 10, 7, 16, 51, tzinfo=timezone.utc)),
        (10, 'INC-2026-00154', 4, '79876543', 'EG-2026-108911', 'EPS Simulada Andina', 'IPS Salud Calle 80', date(2026, 11, 10), date(2026, 11, 14), 5, 'pendiente', None, None, None, datetime(2026, 11, 11, 13, 33, tzinfo=timezone.utc)),
        (11, 'INC-2026-00156', 6, '1018555444', 'EG-2026-109999', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero', date(2026, 11, 12), date(2026, 11, 13), 2, 'pendiente', None, None, None, datetime(2026, 11, 13, 14, 50, tzinfo=timezone.utc)),
        (12, 'INC-2026-00157', 1, '1023456789', 'EG-2026-109120', 'EPS Simulada Andina', 'IPS Clínica del Norte', date(2026, 11, 13), date(2026, 11, 17), 5, 'pendiente', None, None, None, datetime(2026, 11, 14, 16, 7, tzinfo=timezone.utc)),
    ]
    for sid, rad, uid, doc, num, eps, ips, fi, ff, dias, est, obs, dec_por, dec_en, creada in semillas:
        db.add(Solicitud(
            id=sid, radicado=rad, usuario_id=uid, tipo='enfermedad_general', numero_incapacidad=num,
            eps=eps, ips=ips, fecha_inicio=fi, fecha_fin=ff, dias=dias, es_prorroga=False,
            documento_nombre=f'incapacidad_{num}.pdf', documento_ruta=f'seed/{rad}.pdf',
            documento_tamano=180000, documento_sha256='0' * 64, estado=est, observacion=obs,
            decidida_por=dec_por, decidida_en=dec_en, creada_en=creada,
        ))
        val = validar_contra_eps(doc, 'enfermedad_general', fi, ff, eps, reg_map.get(num), creada)
        db.add(Validacion(solicitud_id=sid, **val))
        db.add(Historial(solicitud_id=sid, fecha=creada, actor='Sistema', accion='Validación automática', detalle=val['resultado']))

    db.commit()
