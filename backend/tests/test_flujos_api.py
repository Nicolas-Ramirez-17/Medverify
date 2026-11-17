def _auth(client, email: str, password: str = 'Demo2026*') -> dict[str, str]:
    r = client.post('/api/v1/auth/login', json={'email': email, 'password': password})
    assert r.status_code == 200, r.text
    return {'Authorization': f'Bearer {r.json()["access_token"]}'}


def test_login_roles_y_cuenta_desactivada(client):
    # Contraseña incorrecta -> 401 genérico
    malo = client.post('/api/v1/auth/login', json={'email': 'laura.gomez@horizonte.test', 'password': 'otra'})
    assert malo.status_code == 401

    # Paola desactivada -> 403
    paola = client.post('/api/v1/auth/login', json={'email': 'paola.mendez@horizonte.test', 'password': 'Demo2026*'})
    assert paola.status_code == 403

    # /auth/me mantiene sesión
    hdrs = _auth(client, 'laura.gomez@horizonte.test')
    me = client.get('/api/v1/auth/me', headers=hdrs)
    assert me.status_code == 200
    assert me.json()['rol'] == 'empleado'


def test_flujo_completo_radicacion_validacion_correo_y_decision(client, correos_enviados):
    hdr_laura = _auth(client, 'laura.gomez@horizonte.test')
    hdr_rrhh = _auth(client, 'talentohumano@horizonte.test')

    # Archivo falso (.png renombrado) -> 415
    bad_tipo = client.post(
        '/api/v1/solicitudes',
        headers=hdr_laura,
        data={
            'tipo': 'enfermedad_general',
            'numero_incapacidad': 'EG-2026-109640',
            'eps': 'EPS Simulada Andina',
            'ips': 'IPS Clínica del Norte',
            'fecha_inicio': '2026-11-16',
            'fecha_fin': '2026-11-18',
            'es_prorroga': 'false',
        },
        files={'archivo': ('falso.pdf', b'\x89PNG\r\n\x1a\n', 'application/pdf')},
    )
    assert bad_tipo.status_code == 415

    # Archivo > 5 MB -> 413
    grande = client.post(
        '/api/v1/solicitudes',
        headers=hdr_laura,
        data={
            'tipo': 'enfermedad_general',
            'numero_incapacidad': 'EG-2026-109640',
            'eps': 'EPS Simulada Andina',
            'ips': 'IPS Clínica del Norte',
            'fecha_inicio': '2026-11-16',
            'fecha_fin': '2026-11-18',
            'es_prorroga': 'false',
        },
        files={'archivo': ('grande.pdf', b'%PDF-1.4\n' + b'0' * (5 * 1024 * 1024 + 10), 'application/pdf')},
    )
    assert grande.status_code == 413

    # Radicación válida de Laura con EG-2026-109640
    ok = client.post(
        '/api/v1/solicitudes',
        headers=hdr_laura,
        data={
            'tipo': 'enfermedad_general',
            'numero_incapacidad': 'EG-2026-109640',
            'eps': 'EPS Simulada Andina',
            'ips': 'IPS Clínica del Norte',
            'fecha_inicio': '2026-11-16',
            'fecha_fin': '2026-11-18',
            'es_prorroga': 'false',
        },
        files={'archivo': ('soporte.pdf', b'%PDF-1.4\ncontenido simulado', 'application/pdf')},
    )
    assert ok.status_code == 201, ok.text
    datos = ok.json()
    assert datos['radicado'] == 'INC-2026-00158'
    assert datos['estado'] == 'pendiente'
    # Empleado no ve el resultado de validación
    assert datos['resultado_validacion'] is None
    assert datos['validacion'] is None

    # Correo enviado y registrado
    assert len(correos_enviados) == 1
    assert correos_enviados[0]['para'] == 'talentohumano@horizonte.test'
    correos = client.get('/api/v1/correos', headers=hdr_rrhh)
    assert correos.status_code == 200
    assert correos.json()[0]['radicado'] == 'INC-2026-00158'

    # Duplicado activo -> 409 en numero_incapacidad
    dup = client.post(
        '/api/v1/solicitudes',
        headers=hdr_laura,
        data={
            'tipo': 'enfermedad_general',
            'numero_incapacidad': 'eg-2026-109640',
            'eps': 'EPS Simulada Andina',
            'ips': 'IPS Clínica del Norte',
            'fecha_inicio': '2026-11-16',
            'fecha_fin': '2026-11-18',
            'es_prorroga': 'false',
        },
        files={'archivo': ('soporte.pdf', b'%PDF-1.4\notro', 'application/pdf')},
    )
    assert dup.status_code == 409

    # Talento Humano ve la validación 100% y descarga el PDF
    sol_id = datos['id']
    det = client.get(f'/api/v1/solicitudes/{sol_id}', headers=hdr_rrhh)
    assert det.status_code == 200
    assert det.json()['validacion']['resultado'] == 'coincide'
    assert det.json()['validacion']['porcentaje'] == 100

    pdf = client.get(f'/api/v1/solicitudes/{sol_id}/documento', headers=hdr_rrhh)
    assert pdf.status_code == 200
    assert pdf.headers['content-type'] == 'application/pdf'
    assert pdf.content.startswith(b'%PDF-')

    # Rechazar sin motivo válido -> 422
    rech_malo = client.patch(
        f'/api/v1/solicitudes/{sol_id}/decision',
        headers=hdr_rrhh,
        json={'estado': 'rechazada', 'observacion': 'corto'},
    )
    assert rech_malo.status_code == 422

    # Aprobar solicitud -> 200 y notificación a Laura
    apr = client.patch(
        f'/api/v1/solicitudes/{sol_id}/decision',
        headers=hdr_rrhh,
        json={'estado': 'aprobada', 'observacion': 'Todo en regla.'},
    )
    assert apr.status_code == 200
    assert apr.json()['estado'] == 'aprobada'

    # Decidir de nuevo -> 409
    apr2 = client.patch(
        f'/api/v1/solicitudes/{sol_id}/decision',
        headers=hdr_rrhh,
        json={'estado': 'aprobada', 'observacion': None},
    )
    assert apr2.status_code == 409

    notifs = client.get('/api/v1/notificaciones', headers=hdr_laura)
    assert notifs.status_code == 200
    assert any('INC-2026-00158' in n['mensaje'] and 'aprobada' in n['mensaje'] for n in notifs.json())


def test_aislamiento_permisos_paneles_y_admin(client):
    hdr_laura = _auth(client, 'laura.gomez@horizonte.test')
    hdr_rrhh = _auth(client, 'talentohumano@horizonte.test')
    hdr_admin = _auth(client, 'admin@medverify.test')

    # Empleado pidiendo solicitud de Diana (id=4) -> 404
    assert client.get('/api/v1/solicitudes/4', headers=hdr_laura).status_code == 404
    # Empleado pidiendo /usuarios -> 403
    assert client.get('/api/v1/usuarios', headers=hdr_laura).status_code == 403

    # Paneles
    p_emp = client.get('/api/v1/paneles/empleado', headers=hdr_laura)
    assert p_emp.status_code == 200
    assert p_emp.json()['dias_aprobados_anio'] >= 3

    p_empresa = client.get('/api/v1/paneles/empresa', headers=hdr_rrhh)
    assert p_empresa.status_code == 200
    assert len(p_empresa.json()['por_semana']) == 8

    p_admin = client.get('/api/v1/paneles/admin', headers=hdr_admin)
    assert p_admin.status_code == 200
    assert p_admin.json()['empresas'] == 2

    # Admin no puede desactivarse a sí mismo -> 400
    assert client.patch('/api/v1/usuarios/10', headers=hdr_admin, json={'activo': False}).status_code == 400

    # Admin CRUD EPS
    reg_in = {
        'numero': 'EG-2026-199999',
        'documento': '1023456789',
        'nombre_paciente': 'Laura Gómez Pardo',
        'tipo': 'enfermedad_general',
        'fecha_inicio': '2026-11-18',
        'fecha_fin': '2026-11-20',
        'eps': 'EPS Simulada Andina',
        'ips': 'IPS Clínica del Norte',
    }
    crea_eps = client.post('/api/v1/eps/registros', headers=hdr_admin, json=reg_in)
    assert crea_eps.status_code == 201
    assert crea_eps.json()['dias'] == 3

    assert client.delete('/api/v1/eps/registros/EG-2026-199999', headers=hdr_admin).status_code == 204

    # Auditoría y estado del sistema
    aud = client.get('/api/v1/auditoria?pagina=1&tamano=10', headers=hdr_admin)
    assert aud.status_code == 200
    assert aud.json()['total'] >= 1

    est = client.get('/api/v1/sistema/estado', headers=hdr_admin)
    assert est.status_code == 200
    assert est.json()['servicios'][0]['estado'] == 'operativo'
