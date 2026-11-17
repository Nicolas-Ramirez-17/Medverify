from datetime import datetime, timezone
import secrets
import smtplib
import string
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from ..audit import registrar_auditoria
from ..config import settings
from ..db import get_db
from ..email_service import enviar_correo_bienvenida_usuario
from ..models import Auditoria, Empresa, RegistroEps, Usuario, ahora_utc
from ..schemas import (
    EmpresaIn,
    EmpresaOut,
    EstadoServicioOut,
    EstadoSistemaOut,
    EventoAuditoriaOut,
    PaginaAuditoriaOut,
    RegistroEpsIn,
    RegistroEpsOut,
    UsuarioIn,
    UsuarioOut,
    UsuarioPatchIn,
)
from ..security import hash_password, obtener_ip, require_roles
from ..validation import dias_entre

router = APIRouter(tags=['admin'])


def _password_temporal() -> str:
    mayus = string.ascii_uppercase
    minus = string.ascii_lowercase
    digs = string.digits
    todos = mayus + minus + digs
    chars = [secrets.choice(mayus), secrets.choice(minus), secrets.choice(digs)] + [
        secrets.choice(todos) for _ in range(9)
    ]
    secrets.SystemRandom().shuffle(chars)
    return ''.join(chars)


@router.get('/usuarios', response_model=list[UsuarioOut])
def listar_usuarios(
    q: str | None = None,
    _admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    stmt = select(Usuario).order_by(Usuario.id.asc())
    if q and q.strip():
        patron = f'%{q.strip().lower()}%'
        stmt = stmt.where(
            or_(
                func.lower(Usuario.nombre).like(patron),
                func.lower(Usuario.email).like(patron),
                func.lower(Usuario.documento).like(patron),
            )
        )
    return [UsuarioOut.model_validate(u) for u in db.scalars(stmt).all()]


@router.post('/usuarios', response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    datos: UsuarioIn,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    email_norm = datos.email.strip().lower()
    if db.scalar(select(Usuario).where(func.lower(Usuario.email) == email_norm)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe un usuario con ese correo.')
    if datos.empresa_id is not None and not db.get(Empresa, datos.empresa_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{'loc': ['body', 'empresa_id'], 'msg': 'La empresa seleccionada no existe.', 'type': 'value_error'}],
        )

    temporal = _password_temporal()
    ahora = ahora_utc()
    nuevo = Usuario(
        nombre=datos.nombre.strip(),
        documento=datos.documento,
        email=email_norm,
        password_hash=hash_password(temporal),
        rol=datos.rol,
        empresa_id=datos.empresa_id,
        cargo=datos.cargo.strip() if datos.cargo else None,
        activo=True,
        acepto_tratamiento_datos=ahora,
        creado_en=ahora,
    )
    db.add(nuevo)
    db.flush()
    registrar_auditoria(
        db,
        usuario=admin,
        rol=admin.rol,
        accion='Creación de usuario',
        objeto=f'{nuevo.email} ({nuevo.rol})',
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(nuevo)

    enviar_correo_bienvenida_usuario(nuevo.email, nuevo.nombre, temporal)
    return UsuarioOut.model_validate(nuevo)


@router.patch('/usuarios/{usuario_id}', response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    cambios: UsuarioPatchIn,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    objetivo = db.get(Usuario, usuario_id)
    if not objetivo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Usuario no encontrado.')

    if objetivo.id == admin.id:
        if cambios.rol is not None and cambios.rol != admin.rol:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No puedes cambiar tu propio rol.')
        if cambios.activo is False:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No puedes desactivar tu propia cuenta.')

    acciones: list[str] = []
    if cambios.rol is not None and cambios.rol != objetivo.rol:
        objetivo.rol = cambios.rol
        if cambios.rol == 'admin':
            objetivo.empresa_id = None
        acciones.append('Cambio de rol')
    if cambios.activo is not None and cambios.activo != objetivo.activo:
        objetivo.activo = cambios.activo
        acciones.append('Activación/Desactivación de usuario')
    if cambios.nombre is not None:
        objetivo.nombre = cambios.nombre
    if 'cargo' in cambios.model_fields_set:
        objetivo.cargo = cambios.cargo.strip() if cambios.cargo else None

    for accion in (acciones or ['Actualización de perfil']):
        registrar_auditoria(
            db,
            usuario=admin,
            rol=admin.rol,
            accion=accion,
            objeto=objetivo.email,
            ip=obtener_ip(request),
        )
    db.commit()
    db.refresh(objetivo)
    return UsuarioOut.model_validate(objetivo)


@router.get('/empresas', response_model=list[EmpresaOut])
def listar_empresas(
    _admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    empresas = db.scalars(select(Empresa).order_by(Empresa.id.asc())).all()
    conteos = dict(
        db.execute(
            select(Usuario.empresa_id, func.count(Usuario.id))
            .where(Usuario.rol == 'empleado', Usuario.empresa_id.is_not(None))
            .group_by(Usuario.empresa_id)
        ).all()
    )
    return [
        EmpresaOut(
            id=e.id,
            razon_social=e.razon_social,
            nit=e.nit,
            ciudad=e.ciudad,
            email_notificaciones=e.email_notificaciones,
            activa=e.activa,
            total_empleados=int(conteos.get(e.id, 0)),
        )
        for e in empresas
    ]


@router.post('/empresas', response_model=EmpresaOut, status_code=status.HTTP_201_CREATED)
def crear_empresa(
    datos: EmpresaIn,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    if db.scalar(select(Empresa).where(Empresa.nit == datos.nit)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe una empresa con ese NIT.')

    empresa = Empresa(
        razon_social=datos.razon_social.strip(),
        nit=datos.nit,
        ciudad=datos.ciudad.strip(),
        email_notificaciones=datos.email_notificaciones.strip().lower(),
        activa=True,
        creada_en=ahora_utc(),
    )
    db.add(empresa)
    db.flush()
    registrar_auditoria(
        db,
        usuario=admin,
        rol=admin.rol,
        accion='Registro de empresa',
        objeto=f'{empresa.razon_social} ({empresa.nit})',
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(empresa)

    return EmpresaOut(
        id=empresa.id,
        razon_social=empresa.razon_social,
        nit=empresa.nit,
        ciudad=empresa.ciudad,
        email_notificaciones=empresa.email_notificaciones,
        activa=empresa.activa,
        total_empleados=0,
    )


@router.get('/eps/registros', response_model=list[RegistroEpsOut])
def listar_registros_eps(
    q: str | None = None,
    _admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    stmt = select(RegistroEps).order_by(RegistroEps.numero.asc())
    if q and q.strip():
        patron = f'%{q.strip().lower()}%'
        stmt = stmt.where(
            or_(
                func.lower(RegistroEps.numero).like(patron),
                func.lower(RegistroEps.documento).like(patron),
                func.lower(RegistroEps.nombre_paciente).like(patron),
            )
        )
    return [RegistroEpsOut.model_validate(r) for r in db.scalars(stmt).all()]


@router.post('/eps/registros', response_model=RegistroEpsOut, status_code=status.HTTP_201_CREATED)
def crear_registro_eps(
    datos: RegistroEpsIn,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    if db.get(RegistroEps, datos.numero):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe un registro EPS con ese número.')

    reg = RegistroEps(
        numero=datos.numero,
        documento=datos.documento,
        nombre_paciente=datos.nombre_paciente.strip(),
        tipo=datos.tipo,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        dias=dias_entre(datos.fecha_inicio, datos.fecha_fin),
        eps=datos.eps.strip(),
        ips=datos.ips.strip(),
    )
    db.add(reg)
    registrar_auditoria(
        db,
        usuario=admin,
        rol=admin.rol,
        accion='Creación de registro EPS',
        objeto=reg.numero,
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(reg)
    return RegistroEpsOut.model_validate(reg)


@router.put('/eps/registros/{numero}', response_model=RegistroEpsOut)
def editar_registro_eps(
    numero: str,
    datos: RegistroEpsIn,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    reg = db.scalar(select(RegistroEps).where(func.upper(RegistroEps.numero) == numero.strip().upper()))
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Registro EPS no encontrado.')

    reg.documento = datos.documento
    reg.nombre_paciente = datos.nombre_paciente.strip()
    reg.tipo = datos.tipo
    reg.fecha_inicio = datos.fecha_inicio
    reg.fecha_fin = datos.fecha_fin
    reg.dias = dias_entre(datos.fecha_inicio, datos.fecha_fin)
    reg.eps = datos.eps.strip()
    reg.ips = datos.ips.strip()

    registrar_auditoria(
        db,
        usuario=admin,
        rol=admin.rol,
        accion='Edición de registro EPS',
        objeto=reg.numero,
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(reg)
    return RegistroEpsOut.model_validate(reg)


@router.delete('/eps/registros/{numero}', status_code=status.HTTP_204_NO_CONTENT)
def eliminar_registro_eps(
    numero: str,
    request: Request,
    admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    reg = db.scalar(select(RegistroEps).where(func.upper(RegistroEps.numero) == numero.strip().upper()))
    if not reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Registro EPS no encontrado.')

    num = reg.numero
    db.delete(reg)
    registrar_auditoria(
        db,
        usuario=admin,
        rol=admin.rol,
        accion='Eliminación de registro EPS',
        objeto=num,
        ip=obtener_ip(request),
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/auditoria', response_model=PaginaAuditoriaOut)
def listar_auditoria(
    q: str | None = None,
    pagina: int = Query(1, ge=1),
    tamano: int = Query(50, ge=1, le=200),
    _admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    stmt = select(Auditoria)
    if q and q.strip():
        patron = f'%{q.strip().lower()}%'
        stmt = stmt.where(
            or_(
                func.lower(Auditoria.usuario_nombre).like(patron),
                func.lower(Auditoria.accion).like(patron),
                func.lower(Auditoria.objeto).like(patron),
            )
        )
    stmt = stmt.order_by(Auditoria.fecha.desc(), Auditoria.id.desc())
    todas = db.scalars(stmt).all()
    total = len(todas)
    inicio = (pagina - 1) * tamano
    items = [
        EventoAuditoriaOut(
            id=a.id,
            fecha=a.fecha,
            usuario=a.usuario_nombre,
            rol=a.rol,  # type: ignore[arg-type]
            accion=a.accion,
            objeto=a.objeto,
            ip=a.ip,
        )
        for a in todas[inicio:inicio + tamano]
    ]
    return PaginaAuditoriaOut(items=items, total=total, pagina=pagina, tamano=tamano)


@router.get('/sistema/estado', response_model=EstadoSistemaOut)
def estado_sistema(
    _admin: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    servicios: list[EstadoServicioOut] = []

    try:
        db.execute(text('SELECT 1'))
        servicios.append(EstadoServicioOut(nombre='Base de datos', estado='operativo', detalle='Conexión activa'))
    except Exception as exc:  # noqa: BLE001
        servicios.append(EstadoServicioOut(nombre='Base de datos', estado='caido', detalle=str(exc)))

    try:
        settings.pdf_dir.mkdir(parents=True, exist_ok=True)
        prueba = settings.pdf_dir / '.probe'
        prueba.write_bytes(b'ok')
        prueba.unlink(missing_ok=True)
        servicios.append(EstadoServicioOut(nombre='Almacenamiento PDF', estado='operativo', detalle=str(settings.pdf_dir)))
    except Exception as exc:  # noqa: BLE001
        servicios.append(EstadoServicioOut(nombre='Almacenamiento PDF', estado='caido', detalle=str(exc)))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=2) as smtp:
            smtp.noop()
        servicios.append(
            EstadoServicioOut(nombre='Correo SMTP', estado='operativo', detalle=f'{settings.smtp_host}:{settings.smtp_port}')
        )
    except Exception:  # noqa: BLE001
        servicios.append(
            EstadoServicioOut(
                nombre='Correo SMTP',
                estado='degradado',
                detalle=f'Sin respuesta en {settings.smtp_host}:{settings.smtp_port}',
            )
        )

    return EstadoSistemaOut(
        version=settings.app_version,
        disponibilidad_30d=99.9,
        ultima_copia=datetime.now(timezone.utc),
        servicios=servicios,
    )
