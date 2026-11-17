from datetime import datetime, timedelta, timezone
from typing import Iterable
import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import Usuario

bearer_scheme = HTTPBearer(auto_error=False)
MENSAJE_SESION_EXPIRADA = 'Tu sesión expiró. Inicia sesión de nuevo.'


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except ValueError:
        return False


def crear_token(usuario_id: int, rol: str) -> str:
    ahora = datetime.now(timezone.utc)
    payload = {
        'sub': str(usuario_id),
        'rol': rol,
        'iat': int(ahora.timestamp()),
        'exp': int((ahora + timedelta(minutes=settings.jwt_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm='HS256')


def obtener_ip(request: Request) -> str:
    xff = request.headers.get('x-forwarded-for')
    if xff:
        return xff.split(',')[0].strip()
    return request.client.host if request.client else ''


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    if not creds or creds.scheme.lower() != 'bearer':
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=MENSAJE_SESION_EXPIRADA)
    try:
        payload = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=['HS256'])
        sub = int(payload['sub'])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=MENSAJE_SESION_EXPIRADA)

    usuario = db.get(Usuario, sub)
    if not usuario:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=MENSAJE_SESION_EXPIRADA)
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Tu cuenta está desactivada. Comunícate con el administrador.',
        )
    return usuario


def require_roles(*roles: str):
    permitidos = set(roles)

    def _dep(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol not in permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail='No tienes permiso para realizar esta acción.',
            )
        return usuario

    return _dep


def roles_permitidos(usuario: Usuario, roles: Iterable[str]) -> bool:
    return usuario.rol in set(roles)
