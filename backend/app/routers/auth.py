from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..audit import registrar_auditoria
from ..db import get_db
from ..models import Empresa, Usuario, ahora_utc
from ..schemas import (
    CambioPasswordIn,
    EmpresaPublicaOut,
    LoginIn,
    PerfilPatchIn,
    RegistroEmpleadoIn,
    RegistroEmpresaIn,
    TokenResponse,
    UsuarioOut,
)
from ..security import crear_token, get_current_user, hash_password, obtener_ip, verify_password

router = APIRouter(tags=['auth'])


@router.post('/auth/login', response_model=TokenResponse)
def login(datos: LoginIn, request: Request, db: Session = Depends(get_db)):
    email_norm = datos.email.strip().lower()
    usuario = db.scalar(select(Usuario).where(func.lower(Usuario.email) == email_norm))
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Correo o contraseña incorrectos.')
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Tu cuenta está desactivada. Comunícate con el administrador.',
        )

    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Inicio de sesión',
        objeto=usuario.email,
        ip=obtener_ip(request),
    )
    db.commit()

    return TokenResponse(
        access_token=crear_token(usuario.id, usuario.rol),
        usuario=UsuarioOut.model_validate(usuario),
    )


@router.post('/auth/registro/empleado', response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registro_empleado(datos: RegistroEmpleadoIn, request: Request, db: Session = Depends(get_db)):
    email_norm = datos.email.strip().lower()
    if db.scalar(select(Usuario).where(func.lower(Usuario.email) == email_norm)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe una cuenta con ese correo.')

    empresa = db.get(Empresa, datos.empresa_id)
    if not empresa or not empresa.activa:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{'loc': ['body', 'empresa_id'], 'msg': 'Selecciona una empresa activa.', 'type': 'value_error'}],
        )

    ahora = ahora_utc()
    usuario = Usuario(
        nombre=datos.nombre,
        documento=datos.documento,
        email=email_norm,
        password_hash=hash_password(datos.password),
        rol='empleado',
        empresa_id=empresa.id,
        cargo=None,
        activo=True,
        acepto_tratamiento_datos=ahora,
        creado_en=ahora,
    )
    db.add(usuario)
    db.flush()
    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Registro de cuenta',
        objeto=usuario.email,
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(usuario)

    return TokenResponse(
        access_token=crear_token(usuario.id, usuario.rol),
        usuario=UsuarioOut.model_validate(usuario),
    )


@router.post('/auth/registro/empresa', response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def registro_empresa(datos: RegistroEmpresaIn, request: Request, db: Session = Depends(get_db)):
    email_norm = datos.email.strip().lower()
    if db.scalar(select(Usuario).where(func.lower(Usuario.email) == email_norm)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe una cuenta con ese correo.')
    if db.scalar(select(Empresa).where(Empresa.nit == datos.nit)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Ya existe una empresa registrada con ese NIT.')

    ahora = ahora_utc()
    empresa = Empresa(
        razon_social=datos.razon_social,
        nit=datos.nit,
        ciudad=datos.ciudad,
        email_notificaciones=email_norm,
        activa=True,
        creada_en=ahora,
    )
    db.add(empresa)
    db.flush()

    usuario = Usuario(
        nombre=f'Talento Humano · {datos.razon_social}',
        documento='900000000',
        email=email_norm,
        password_hash=hash_password(datos.password),
        rol='empresa',
        empresa_id=empresa.id,
        cargo='Talento Humano',
        activo=True,
        acepto_tratamiento_datos=ahora,
        creado_en=ahora,
    )
    db.add(usuario)
    db.flush()
    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Registro de empresa',
        objeto=f'{empresa.razon_social} ({empresa.nit})',
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(usuario)

    return TokenResponse(
        access_token=crear_token(usuario.id, usuario.rol),
        usuario=UsuarioOut.model_validate(usuario),
    )


@router.get('/auth/me', response_model=UsuarioOut)
def me(usuario: Usuario = Depends(get_current_user)):
    return UsuarioOut.model_validate(usuario)


@router.put('/auth/password', status_code=status.HTTP_204_NO_CONTENT)
def cambiar_password(
    datos: CambioPasswordIn,
    request: Request,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[{'loc': ['body', 'password_actual'], 'msg': 'La contraseña actual no es correcta.', 'type': 'value_error'}],
        )
    usuario.password_hash = hash_password(datos.password_nueva)
    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Cambio de contraseña',
        objeto=usuario.email,
        ip=obtener_ip(request),
    )
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch('/usuarios/me', response_model=UsuarioOut)
def actualizar_perfil(
    datos: PerfilPatchIn,
    request: Request,
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if datos.nombre is not None:
        usuario.nombre = datos.nombre
    if 'cargo' in datos.model_fields_set:
        usuario.cargo = datos.cargo.strip() if datos.cargo else None

    registrar_auditoria(
        db,
        usuario=usuario,
        rol=usuario.rol,
        accion='Actualización de perfil',
        objeto=usuario.email,
        ip=obtener_ip(request),
    )
    db.commit()
    db.refresh(usuario)
    return UsuarioOut.model_validate(usuario)


@router.get('/empresas/publicas', response_model=list[EmpresaPublicaOut])
def empresas_publicas(db: Session = Depends(get_db)):
    filas = db.scalars(
        select(Empresa).where(Empresa.activa.is_(True)).order_by(Empresa.razon_social.asc())
    ).all()
    return [EmpresaPublicaOut.model_validate(e) for e in filas]
