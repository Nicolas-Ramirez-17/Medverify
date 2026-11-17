from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..models import Correo, Notificacion, Solicitud, Usuario
from ..schemas import CorreoOut, NotificacionOut
from ..security import get_current_user, require_roles

router = APIRouter(tags=['notificaciones'])


def _filtro_notificaciones(usuario: Usuario):
    if usuario.rol == 'empleado':
        return Notificacion.usuario_id == usuario.id
    if usuario.rol == 'empresa':
        return Notificacion.empresa_id == usuario.empresa_id
    return Notificacion.empresa_id.is_not(None)


@router.get('/notificaciones', response_model=list[NotificacionOut])
def listar_notificaciones(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    filas = db.scalars(
        select(Notificacion)
        .where(_filtro_notificaciones(usuario))
        .order_by(Notificacion.creada_en.desc(), Notificacion.id.desc())
        .limit(20)
    ).all()
    return [NotificacionOut.model_validate(n) for n in filas]


@router.post('/notificaciones/marcar-leidas', status_code=status.HTTP_204_NO_CONTENT)
def marcar_leidas(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.execute(
        update(Notificacion)
        .where(_filtro_notificaciones(usuario), Notificacion.leida.is_(False))
        .values(leida=True)
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/correos', response_model=list[CorreoOut])
def listar_correos(
    usuario: Usuario = Depends(require_roles('empresa', 'admin')),
    db: Session = Depends(get_db),
):
    q = (
        select(Correo)
        .join(Correo.solicitud)
        .join(Solicitud.empleado)
        .options(
            joinedload(Correo.solicitud).joinedload(Solicitud.empleado),
            joinedload(Correo.solicitud).joinedload(Solicitud.validacion),
        )
        .order_by(Correo.enviado_en.desc(), Correo.id.desc())
    )
    if usuario.rol == 'empresa':
        q = q.where(Usuario.empresa_id == usuario.empresa_id)

    filas = db.scalars(q).unique().all()
    return [
        CorreoOut(
            id=c.id,
            para=c.para,
            asunto=c.asunto,
            enviado_en=c.enviado_en,
            estado=c.estado,  # type: ignore[arg-type]
            solicitud_id=c.solicitud_id,
            radicado=c.solicitud.radicado,
            empleado=c.solicitud.empleado.nombre,
            tipo=c.solicitud.tipo,  # type: ignore[arg-type]
            fecha_inicio=c.solicitud.fecha_inicio,
            fecha_fin=c.solicitud.fecha_fin,
            dias=c.solicitud.dias,
            resultado_validacion=c.solicitud.validacion.resultado if c.solicitud.validacion else 'no_encontrada',  # type: ignore[arg-type]
        )
        for c in filas
    ]
