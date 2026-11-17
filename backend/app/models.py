from datetime import date, datetime, timezone
from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, ForeignKey, Index, Integer, JSON, Sequence, Text, func, text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def ahora_utc() -> datetime:
    return datetime.now(timezone.utc)


radicado_seq = Sequence('radicado_seq', start=1)


class Empresa(Base):
    __tablename__ = 'empresas'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    razon_social: Mapped[str] = mapped_column(Text, nullable=False)
    nit: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    ciudad: Mapped[str] = mapped_column(Text, nullable=False, default='—')
    email_notificaciones: Mapped[str] = mapped_column(Text, nullable=False)
    activa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)

    usuarios: Mapped[list['Usuario']] = relationship(back_populates='empresa')


class Usuario(Base):
    __tablename__ = 'usuarios'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(Text, nullable=False)
    documento: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    rol: Mapped[str] = mapped_column(Text, nullable=False)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey('empresas.id'), nullable=True)
    cargo: Mapped[str | None] = mapped_column(Text, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    acepto_tratamiento_datos: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)

    empresa: Mapped['Empresa | None'] = relationship(back_populates='usuarios')

    __table_args__ = (
        Index('usuarios_email_unico', func.lower(email), unique=True),
    )


class RegistroEps(Base):
    __tablename__ = 'registros_eps'

    numero: Mapped[str] = mapped_column(Text, primary_key=True)
    documento: Mapped[str] = mapped_column(Text, nullable=False)
    nombre_paciente: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    dias: Mapped[int] = mapped_column(Integer, nullable=False)
    eps: Mapped[str] = mapped_column(Text, nullable=False)
    ips: Mapped[str] = mapped_column(Text, nullable=False)


class Solicitud(Base):
    __tablename__ = 'solicitudes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    radicado: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey('usuarios.id'), nullable=False)
    tipo: Mapped[str] = mapped_column(Text, nullable=False)
    numero_incapacidad: Mapped[str] = mapped_column(Text, nullable=False)
    eps: Mapped[str] = mapped_column(Text, nullable=False)
    ips: Mapped[str] = mapped_column(Text, nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_fin: Mapped[date] = mapped_column(Date, nullable=False)
    dias: Mapped[int] = mapped_column(Integer, nullable=False)
    es_prorroga: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    documento_nombre: Mapped[str] = mapped_column(Text, nullable=False)
    documento_ruta: Mapped[str] = mapped_column(Text, nullable=False)
    documento_tamano: Mapped[int] = mapped_column(Integer, nullable=False)
    documento_sha256: Mapped[str] = mapped_column(Text, nullable=False)
    estado: Mapped[str] = mapped_column(Text, nullable=False, default='pendiente')
    observacion: Mapped[str | None] = mapped_column(Text, nullable=True)
    decidida_por: Mapped[int | None] = mapped_column(ForeignKey('usuarios.id'), nullable=True)
    decidida_en: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)

    empleado: Mapped['Usuario'] = relationship(foreign_keys=[usuario_id])
    decisor: Mapped['Usuario | None'] = relationship(foreign_keys=[decidida_por])
    validacion: Mapped['Validacion | None'] = relationship(back_populates='solicitud', uselist=False, cascade='all, delete-orphan')
    historial: Mapped[list['Historial']] = relationship(back_populates='solicitud', order_by='Historial.fecha.asc(), Historial.id.asc()', cascade='all, delete-orphan')

    __table_args__ = (
        Index('solicitudes_numero_activo', func.upper(numero_incapacidad), unique=True, sqlite_where=text("estado <> 'rechazada'"), postgresql_where=text("estado <> 'rechazada'")),
        Index('solicitudes_usuario', usuario_id),
        Index('solicitudes_estado_fecha', estado, creada_en),
    )


class Validacion(Base):
    __tablename__ = 'validaciones'

    solicitud_id: Mapped[int] = mapped_column(ForeignKey('solicitudes.id', ondelete='CASCADE'), primary_key=True)
    resultado: Mapped[str] = mapped_column(Text, nullable=False)
    porcentaje: Mapped[int] = mapped_column(Integer, nullable=False)
    campos: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    registro_eps_numero: Mapped[str | None] = mapped_column(Text, nullable=True)
    registro_eps_ips: Mapped[str | None] = mapped_column(Text, nullable=True)
    validado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)

    solicitud: Mapped['Solicitud'] = relationship(back_populates='validacion')


class Historial(Base):
    __tablename__ = 'historial'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    solicitud_id: Mapped[int] = mapped_column(ForeignKey('solicitudes.id', ondelete='CASCADE'), nullable=False)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)
    actor: Mapped[str] = mapped_column(Text, nullable=False)
    accion: Mapped[str] = mapped_column(Text, nullable=False)
    detalle: Mapped[str] = mapped_column(Text, nullable=False, default='')

    solicitud: Mapped['Solicitud'] = relationship(back_populates='historial')

    __table_args__ = (Index('historial_solicitud', solicitud_id, fecha),)


class Correo(Base):
    __tablename__ = 'correos'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    solicitud_id: Mapped[int] = mapped_column(ForeignKey('solicitudes.id'), nullable=False)
    para: Mapped[str] = mapped_column(Text, nullable=False)
    asunto: Mapped[str] = mapped_column(Text, nullable=False)
    enviado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)
    estado: Mapped[str] = mapped_column(Text, nullable=False)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)

    solicitud: Mapped['Solicitud'] = relationship()


class Notificacion(Base):
    __tablename__ = 'notificaciones'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey('usuarios.id'), nullable=True)
    empresa_id: Mapped[int | None] = mapped_column(ForeignKey('empresas.id'), nullable=True)
    solicitud_id: Mapped[int | None] = mapped_column(ForeignKey('solicitudes.id'), nullable=True)
    mensaje: Mapped[str] = mapped_column(Text, nullable=False)
    leida: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    creada_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)


class Auditoria(Base):
    __tablename__ = 'auditoria'

    id: Mapped[int] = mapped_column(BigInteger().with_variant(Integer, 'sqlite'), primary_key=True, autoincrement=True)
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=ahora_utc)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey('usuarios.id'), nullable=True)
    usuario_nombre: Mapped[str] = mapped_column(Text, nullable=False)
    rol: Mapped[str] = mapped_column(Text, nullable=False)
    accion: Mapped[str] = mapped_column(Text, nullable=False)
    objeto: Mapped[str] = mapped_column(Text, nullable=False, default='')
    ip: Mapped[str] = mapped_column(Text, nullable=False, default='')

    __table_args__ = (Index('auditoria_fecha', fecha.desc()),)
