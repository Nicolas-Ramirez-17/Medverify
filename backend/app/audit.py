from sqlalchemy.orm import Session

from .models import Auditoria, Usuario, ahora_utc


def registrar_auditoria(
    db: Session,
    *,
    usuario: Usuario | None,
    rol: str,
    accion: str,
    objeto: str = '',
    ip: str = '',
    usuario_nombre: str | None = None,
) -> None:
    db.add(
        Auditoria(
            fecha=ahora_utc(),
            usuario_id=usuario.id if usuario else None,
            usuario_nombre=usuario_nombre or (usuario.nombre if usuario else 'Sistema'),
            rol=rol,
            accion=accion,
            objeto=objeto,
            ip=ip,
        )
    )
