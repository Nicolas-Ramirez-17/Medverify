from datetime import date, datetime
import hashlib
from pathlib import Path
from typing import Annotated
from uuid import uuid4
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session, joinedload

from ..audit import registrar_auditoria
from ..config import settings
from ..db import get_db
from ..email_service import notificar_correo_radicacion
from ..models import Empresa, Historial, Notificacion, RegistroEps, Solicitud, Usuario, Validacion, ahora_utc
from ..schemas import (
    DecisionIn,
    DocumentoMetaOut,
    EPS_VALIDAS,
    EmpleadoRefOut,
    EstadoSolicitud,
    EventoHistorialOut,
    PaginaSolicitudesOut,
    REGEX_NUM_INC,
    ResultadoValidacion,
    SolicitudOut,
    SolicitudResumenOut,
    TipoIncapacidad,
    ValidacionOut,
)
from ..security import get_current_user, obtener_ip, require_roles
from ..validation import dias_entre, validar_contra_eps

router = APIRouter(prefix='/solicitudes', tags=['solicitudes'])
BOGOTA_TZ = ZoneInfo('America/Bogota')


def _error_campo(campo: str, msg: str, status_code: int = status.HTTP_422_UNPROCESSABLE_ENTITY) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail=[{'loc': ['body', campo], 'msg': msg, 'type': 'value_error'}],
    )


def _siguiente_radicado(db: Session, anio: int) -> str:
    dialecto = db.bind.dialect.name if db.bind else 'sqlite'
    if dialecto == 'postgresql':
        seq = db.execute(text("SELECT nextval('radicado_seq')")).scalar_one()
        return f'INC-{anio}-{int(seq):05d}'

    prefijo = f'INC-{anio}-'
    existentes = db.scalars(select(Solicitud.radicado).where(Solicitud.radicado.like(f'{prefijo}%'))).all()
    max_num = 0
    for r in existentes:
        try:
            max_num = max(max_num, int(r.split('-')[-1]))
        except ValueError:
            continue
    return f'{prefijo}{max_num + 1:05d}'


def _serializar_resumen(s: Solicitud, rol: str) -> SolicitudResumenOut:
    res_val = None if rol == 'empleado' else (s.validacion.resultado if s.validacion else None)
    return SolicitudResumenOut(
        id=s.id,
        radicado=s.radicado,
        empleado=EmpleadoRefOut(
            id=s.empleado.id,
            nombre=s.empleado.nombre,
            documento=s.empleado.documento,
            cargo=s.empleado.cargo,
        ),
        tipo=s.tipo,  # type: ignore[arg-type]
        numero_incapacidad=s.numero_incapacidad,
        fecha_inicio=s.fecha_inicio,
        fecha_fin=s.fecha_fin,
        dias=s.dias,
        estado=s.estado,  # type: ignore[arg-type]
        resultado_validacion=res_val,  # type: ignore[arg-type]
        creada_en=s.creada_en,
    )


def _serializar_detalle(s: Solicitud, rol: str) -> SolicitudOut:
    resumen = _serializar_resumen(s, rol)
    validacion_out = None
    if rol != 'empleado' and s.validacion is not None:
        validacion_out = ValidacionOut(
            resultado=s.validacion.resultado,  # type: ignore[arg-type]
            porcentaje=s.validacion.porcentaje,
            campos=s.validacion.campos,
            registro_eps_numero=s.validacion.registro_eps_numero,
            registro_eps_ips=s.validacion.registro_eps_ips,
            validado_en=s.validacion.validado_en,
        )
    return SolicitudOut(
        **resumen.model_dump(),
        eps=s.eps,
        ips=s.ips,
        es_prorroga=s.es_prorroga,
        documento=DocumentoMetaOut(nombre=s.documento_nombre, tamano_bytes=s.documento_tamano),
        observacion=s.observacion,
        decidida_por=s.decisor.nombre if s.decisor else None,
        decidida_en=s.decidida_en,
        validacion=validacion_out,
        historial=[
            EventoHistorialOut(id=h.id, fecha=h.fecha, actor=h.actor, accion=h.accion, detalle=h.detalle)
            for h in s.historial
        ],
    )


def _cargar_solicitud_en_alcance(db: Session, solicitud_id: int, usuario: Usuario) -> Solicitud:
    s = db.scalar(
        select(Solicitud)
        .options(
            joinedload(Solicitud.empleado),
            joinedload(Solicitud.decisor),
            joinedload(Solicitud.validacion),
            joinedload(Solicitud.historial),
        )
        .where(Solicitud.id == solicitud_id)
    )
    if not s:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Solicitud no encontrada.')
    if usuario.rol == 'empleado' and s.usuario_id != usuario.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Solicitud no encontrada.')
    if usuario.rol == 'empresa' and s.empleado.empresa_id != usuario.empresa_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Solicitud no encontrada.')
    return s


@router.get('', response_model=PaginaSolicitudesOut)
def listar_solicitudes(
    estado: EstadoSolicitud | None = None,
    validacion: ResultadoValidacion | None = None,
    q: str | None = None,
    orden: str = Query('recientes', pattern='^(recientes|antiguas)$'),
    pagina: int = Query(1, ge=1),
    tamano: int = Query(20, ge=1, le=100),
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Solicitud)
        .join(Solicitud.empleado)
        .outerjoin(Solicitud.validacion)
        .options(joinedload(Solicitud.empleado), joinedload(Solicitud.validacion))
    )

    if usuario.rol == 'empleado':
        stmt = stmt.where(Solicitud.usuario_id == usuario.id)
    elif usuario.rol == 'empresa':
        stmt = stmt.where(Usuario.empresa_id == usuario.empresa_id)

    if estado:
        stmt = stmt.where(Solicitud.estado == estado)
    if validacion and usuario.rol != 'empleado':
        stmt = stmt.where(Validacion.resultado == validacion)
    if q and q.strip():
        patron = f'%{q.strip().lower()}%'
        stmt = stmt.where(
            or_(
                func.lower(Solicitud.radicado).like(patron),
                func.lower(Solicitud.numero_incapacidad).like(patron),
                func.lower(Usuario.nombre).like(patron),
                func.lower(Usuario.documento).like(patron),
            )
        )

    stmt = stmt.order_by(
        Solicitud.creada_en.desc() if orden == 'recientes' else Solicitud.creada_en.asc(),
        Solicitud.id.desc() if orden == 'recientes' else Solicitud.id.asc(),
    )

    todas = db.scalars(stmt).unique().all()
    total = len(todas)
    inicio = (pagina - 1) * tamano
    recorte = todas[inicio:inicio + tamano]
    return PaginaSolicitudesOut(
        items=[_serializar_resumen(s, usuario.rol) for s in recorte],
        total=total,
        pagina=pagina,
        tamano=tamano,
    )


@router.post('', response_model=SolicitudOut, status_code=status.HTTP_201_CREATED)
async def radicar_solicitud(
    request: Request,
    tipo: Annotated[TipoIncapacidad, Form()],
    numero_incapacidad: Annotated[str, Form()],
    eps: Annotated[str, Form()],
    ips: Annotated[str, Form()],
    fecha_inicio: Annotated[date, Form()],
    fecha_fin: Annotated[date, Form()],
    es_prorroga: Annotated[str, Form()] = 'false',
    archivo: UploadFile = File(...),
    usuario: Usuario = Depends(require_roles('empleado')),
    db: Session = Depends(get_db),
):
    num_norm = numero_incapacidad.strip().upper()
    if not REGEX_NUM_INC.match(num_norm):
        raise _error_campo('numero_incapacidad', 'El número debe tener formato XX-0000-000000 (ej. EG-2026-104521).')
    if eps.strip() not in EPS_VALIDAS:
        raise _error_campo('eps', 'Selecciona una EPS válida de la lista.')
    if len(ips.strip()) < 4:
        raise _error_campo('ips', 'Escribe el nombre de la IPS (mínimo 4 caracteres).')
    if fecha_fin < fecha_inicio:
        raise _error_campo('fecha_fin', 'La fecha de finalización no puede ser anterior a la fecha de inicio.')

    contenido = await archivo.read(settings.max_pdf_bytes + 1)
    if len(contenido) > settings.max_pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail='El archivo supera el tamaño máximo de 5 MB.',
        )
    if not contenido.startswith(b'%PDF-'):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail='El archivo debe ser un PDF válido (firma %PDF-).',
        )

    duplicada = db.scalar(
        select(Solicitud).where(
            func.upper(Solicitud.numero_incapacidad) == num_norm,
            Solicitud.estado != 'rechazada',
        )
    )
    if duplicada:
        raise _error_campo(
            'numero_incapacidad',
            f'Ya existe una solicitud activa con el número {num_norm} ({duplicada.radicado}).',
            status_code=status.HTTP_409_CONFLICT,
        )

    prorroga_bool = es_prorroga.strip().lower() in ('true', '1', 'si', 'sí')
    ahora = ahora_utc()
    anio = datetime.now(BOGOTA_TZ).year
    radicado = _siguiente_radicado(db, anio)
    dias = dias_entre(fecha_inicio, fecha_fin)

    settings.pdf_dir.mkdir(parents=True, exist_ok=True)
    nombre_interno = f'{uuid4().hex}.pdf'
    ruta_disco = settings.pdf_dir / nombre_interno
    ruta_disco.write_bytes(contenido)
    sha256 = hashlib.sha256(contenido).hexdigest()
    nombre_original = Path(archivo.filename or f'{radicado}.pdf').name

    solicitud = Solicitud(
        radicado=radicado,
        usuario_id=usuario.id,
        tipo=tipo,
        numero_incapacidad=num_norm,
        eps=eps.strip(),
        ips=ips.strip(),
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        dias=dias,
        es_prorroga=prorroga_bool,
        documento_nombre=nombre_original,
        documento_ruta=nombre_interno,
        documento_tamano=len(contenido),
        documento_sha256=sha256,
        estado='pendiente',
        creada_en=ahora,
    )
    db.add(solicitud)
    db.flush()

    reg_eps = db.scalar(select(RegistroEps).where(func.upper(RegistroEps.numero) == num_norm))
    res_val = validar_contra_eps(
        documento=usuario.documento,
        tipo=tipo,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        eps=eps.strip(),
        registro=reg_eps,
        ahora=ahora,
    )
    db.add(Validacion(solicitud_id=solicitud.id, **res_val))

    detalle_val = {
        'coincide': f'Coincide con la EPS ({res_val["porcentaje"]} % de coincidencia)',
        'inconsistente': f'Con inconsistencias ({res_val["porcentaje"]} % de coincidencia)',
        'no_encontrada': 'No encontrada en la base simulada de la EPS',
    }[res_val['resultado']]

    db.add_all([
        Historial(
            solicitud_id=solicitud.id,
            fecha=ahora,
            actor=usuario.nombre,
            accion='Radicó la solicitud',
            detalle=f'Adjuntó {nombre_original}',
        ),
        Historial(
            solicitud_id=solicitud.id,
            fecha=ahora,
            actor='Sistema',
            accion='Validación automática',
            detalle=detalle_val,
        ),
    ])

    if usuario.empresa_id is not None:
        db.add(
            Notificacion(
                empresa_id=usuario.empresa_id,
                solicitud_id=solicitud.id,
                mensaje=f'{usuario.nombre} radicó {radicado}',
                leida=False,
                creada_en=ahora,
            )
        )

    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Radicación de incapacidad',
        objeto=radicado,
        ip=obtener_ip(request),
    )
    db.commit()

    empresa = db.get(Empresa, usuario.empresa_id) if usuario.empresa_id else None
    if empresa and empresa.email_notificaciones:
        notificar_correo_radicacion(
            db,
            solicitud=solicitud,
            empleado_nombre=usuario.nombre,
            para=empresa.email_notificaciones,
            resultado_validacion=res_val['resultado'],
            porcentaje=res_val['porcentaje'],
        )

    cargada = _cargar_solicitud_en_alcance(db, solicitud.id, usuario)
    return _serializar_detalle(cargada, usuario.rol)


@router.get('/{solicitud_id}', response_model=SolicitudOut)
def obtener_solicitud(
    solicitud_id: int,
    request: Request,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _cargar_solicitud_en_alcance(db, solicitud_id, usuario)
    if usuario.rol in ('empresa', 'admin'):
        registrar_auditoria(
            db,
            usuario=usuario,
            rol=usuario.rol,
            accion='Consulta de solicitud y PDF',
            objeto=s.radicado,
            ip=obtener_ip(request),
        )
        db.commit()
    return _serializar_detalle(s, usuario.rol)


@router.patch('/{solicitud_id}/decision', response_model=SolicitudOut)
def decidir_solicitud(
    solicitud_id: int,
    decision: DecisionIn,
    request: Request,
    usuario: Usuario = Depends(require_roles('empresa')),
    db: Session = Depends(get_db),
):
    s = _cargar_solicitud_en_alcance(db, solicitud_id, usuario)
    if s.estado != 'pendiente':
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Esta solicitud ya fue decidida.')

    ahora = ahora_utc()
    s.estado = decision.estado
    s.observacion = decision.observacion
    s.decisor = usuario
    s.decidida_en = ahora

    es_aprobada = decision.estado == 'aprobada'
    db.add(
        Historial(
            solicitud_id=s.id,
            fecha=ahora,
            actor=usuario.nombre,
            accion='Aprobó la solicitud' if es_aprobada else 'Rechazó la solicitud',
            detalle=decision.observacion or 'Sin observaciones',
        )
    )
    db.add(
        Notificacion(
            usuario_id=s.usuario_id,
            solicitud_id=s.id,
            mensaje=f'Tu solicitud {s.radicado} fue {"aprobada" if es_aprobada else "rechazada"}.',
            leida=False,
            creada_en=ahora,
        )
    )
    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Aprobación de solicitud' if es_aprobada else 'Rechazo de solicitud',
        objeto=s.radicado,
        ip=obtener_ip(request),
    )
    db.commit()

    actualizada = _cargar_solicitud_en_alcance(db, s.id, usuario)
    return _serializar_detalle(actualizada, usuario.rol)


@router.get('/{solicitud_id}/documento')
def descargar_documento(
    solicitud_id: int,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = _cargar_solicitud_en_alcance(db, solicitud_id, usuario)
    ruta = (settings.pdf_dir / s.documento_ruta).resolve()
    base = settings.pdf_dir.resolve()
    if not str(ruta).startswith(str(base)) or not ruta.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='El documento PDF no está disponible.')
    return FileResponse(
        path=ruta,
        media_type='application/pdf',
        headers={'Content-Disposition': f'inline; filename="{s.documento_nombre}"'},
    )
