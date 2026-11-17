from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from ..db import get_db
from ..models import Correo, Empresa, RegistroEps, Solicitud, Usuario
from ..schemas import PanelAdminOut, PanelEmpleadoOut, PanelEmpresaOut, SemanaTotalOut
from ..security import require_roles

router = APIRouter(prefix='/paneles', tags=['paneles'])
BOGOTA_TZ = ZoneInfo('America/Bogota')


def _en_bogota(dt: datetime) -> date:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(BOGOTA_TZ).date()


@router.get('/empleado', response_model=PanelEmpleadoOut)
def panel_empleado(
    usuario: Usuario = Depends(require_roles('empleado')),
    db: Session = Depends(get_db),
):
    filas = db.scalars(select(Solicitud).where(Solicitud.usuario_id == usuario.id)).all()
    anio_actual = datetime.now(BOGOTA_TZ).year
    pendientes = sum(1 for s in filas if s.estado == 'pendiente')
    aprobadas = sum(1 for s in filas if s.estado == 'aprobada')
    rechazadas = sum(1 for s in filas if s.estado == 'rechazada')
    dias_aprobados_anio = sum(
        s.dias for s in filas if s.estado == 'aprobada' and s.fecha_inicio.year == anio_actual
    )
    return PanelEmpleadoOut(
        pendientes=pendientes,
        aprobadas=aprobadas,
        rechazadas=rechazadas,
        dias_aprobados_anio=dias_aprobados_anio,
    )


@router.get('/empresa', response_model=PanelEmpresaOut)
def panel_empresa(
    usuario: Usuario = Depends(require_roles('empresa', 'admin')),
    db: Session = Depends(get_db),
):
    q = select(Solicitud).options(joinedload(Solicitud.validacion), joinedload(Solicitud.empleado))
    if usuario.rol == 'empresa':
        q = q.join(Solicitud.empleado).where(Usuario.empresa_id == usuario.empresa_id)
    filas = db.scalars(q).unique().all()

    pendientes = 0
    pendientes_con_alerta = 0
    aprobadas = 0
    rechazadas = 0
    horas_resp: list[float] = []
    por_validacion = {'coincide': 0, 'inconsistente': 0, 'no_encontrada': 0}

    for s in filas:
        res_val = s.validacion.resultado if s.validacion else 'no_encontrada'
        if res_val in por_validacion:
            por_validacion[res_val] += 1

        if s.estado == 'pendiente':
            pendientes += 1
            if res_val != 'coincide':
                pendientes_con_alerta += 1
        elif s.estado == 'aprobada':
            aprobadas += 1
        elif s.estado == 'rechazada':
            rechazadas += 1

        if s.decidida_en is not None:
            creada = s.creada_en if s.creada_en.tzinfo else s.creada_en.replace(tzinfo=timezone.utc)
            decidida = s.decidida_en if s.decidida_en.tzinfo else s.decidida_en.replace(tzinfo=timezone.utc)
            horas_resp.append(max(0.0, (decidida - creada).total_seconds() / 3600.0))

    horas_promedio = round(sum(horas_resp) / len(horas_resp), 1) if horas_resp else 0.0

    # 8 semanas consecutivas de 7 días terminando hoy (inclusive), de la más antigua a la más reciente.
    hoy = datetime.now(BOGOTA_TZ).date()
    por_semana: list[SemanaTotalOut] = []
    for i in range(7, -1, -1):
        fin = hoy - timedelta(days=i * 7)
        inicio = fin - timedelta(days=6)
        total = sum(1 for s in filas if inicio <= _en_bogota(s.creada_en) <= fin)
        por_semana.append(SemanaTotalOut(semana_inicio=inicio.isoformat(), total=total))

    return PanelEmpresaOut(
        pendientes=pendientes,
        pendientes_con_alerta=pendientes_con_alerta,
        aprobadas=aprobadas,
        rechazadas=rechazadas,
        horas_promedio_respuesta=horas_promedio,
        por_semana=por_semana,
        por_validacion=por_validacion,
    )


@router.get('/admin', response_model=PanelAdminOut)
def panel_admin(
    _usuario: Usuario = Depends(require_roles('admin')),
    db: Session = Depends(get_db),
):
    usuarios = db.scalars(select(Usuario)).all()
    por_rol = {'empleado': 0, 'empresa': 0, 'admin': 0}
    activos = 0
    for u in usuarios:
        if u.activo:
            activos += 1
        if u.rol in por_rol:
            por_rol[u.rol] += 1

    empresas = db.scalar(select(func.count()).select_from(Empresa)) or 0
    registros_eps = db.scalar(select(func.count()).select_from(RegistroEps)) or 0
    solicitudes = db.scalar(select(func.count()).select_from(Solicitud)) or 0
    correos_enviados = db.scalar(
        select(func.count()).select_from(Correo).where(Correo.estado == 'enviado')
    ) or 0

    return PanelAdminOut(
        usuarios_activos=activos,
        usuarios_total=len(usuarios),
        usuarios_por_rol=por_rol,
        empresas=empresas,
        registros_eps=registros_eps,
        solicitudes=solicitudes,
        correos_enviados=correos_enviados,
    )
