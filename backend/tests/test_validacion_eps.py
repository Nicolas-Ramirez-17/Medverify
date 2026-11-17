from datetime import date, datetime, timezone
from app.models import RegistroEps
from app.validation import dias_entre, validar_contra_eps


def test_dias_entre_incluye_extremos():
    assert dias_entre(date(2026, 9, 14), date(2026, 9, 16)) == 3
    assert dias_entre(date(2026, 11, 16), date(2026, 11, 16)) == 1


def test_casos_handoff_seccion_4():
    ahora = datetime(2026, 11, 16, 12, 0, tzinfo=timezone.utc)

    # 1. Todo coincide (6/6 = 100%)
    reg_ok = RegistroEps(
        numero='EG-2026-104521', documento='1023456789', nombre_paciente='Laura Gómez',
        tipo='enfermedad_general', fecha_inicio=date(2026, 9, 14), fecha_fin=date(2026, 9, 16),
        dias=3, eps='EPS Simulada Andina', ips='IPS Clínica del Norte',
    )
    r1 = validar_contra_eps('1023456789', 'enfermedad_general', date(2026, 9, 14), date(2026, 9, 16), '  eps simulada andina ', reg_ok, ahora)
    assert r1['resultado'] == 'coincide'
    assert r1['porcentaje'] == 100
    assert len(r1['campos']) == 6

    # 2. Fecha fin distinta cambia también días (4/6 = 67%)
    reg_fecha = RegistroEps(
        numero='EG-2026-105902', documento='1015987654', nombre_paciente='Diana Ruiz',
        tipo='enfermedad_general', fecha_inicio=date(2026, 10, 6), fecha_fin=date(2026, 10, 8),
        dias=3, eps='EPS Simulada Pacífico', ips='IPS Centro Médico Chapinero',
    )
    r2 = validar_contra_eps('1015987654', 'enfermedad_general', date(2026, 10, 6), date(2026, 10, 9), 'EPS Simulada Pacífico', reg_fecha, ahora)
    assert r2['resultado'] == 'inconsistente'
    assert r2['porcentaje'] == 67

    # 3. EPS distinta (5/6 = 83%)
    reg_eps = RegistroEps(
        numero='EG-2026-108911', documento='79876543', nombre_paciente='Jorge Castillo',
        tipo='enfermedad_general', fecha_inicio=date(2026, 11, 10), fecha_fin=date(2026, 11, 14),
        dias=5, eps='EPS Simulada Caribe', ips='IPS Salud Calle 80',
    )
    r3 = validar_contra_eps('79876543', 'enfermedad_general', date(2026, 11, 10), date(2026, 11, 14), 'EPS Simulada Andina', reg_eps, ahora)
    assert r3['resultado'] == 'inconsistente'
    assert r3['porcentaje'] == 83

    # 4. No encontrada (0%)
    r4 = validar_contra_eps('1018555444', 'enfermedad_general', date(2026, 11, 12), date(2026, 11, 13), 'EPS Simulada Pacífico', None, ahora)
    assert r4['resultado'] == 'no_encontrada'
    assert r4['porcentaje'] == 0
    assert r4['campos'] == []
