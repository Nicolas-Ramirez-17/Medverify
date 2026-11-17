import re
from datetime import date, datetime
from typing import Annotated, Literal
from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, BeforeValidator, ConfigDict, Field, field_validator, model_validator

Rol = Literal['empleado', 'empresa', 'admin']
EstadoSolicitud = Literal['pendiente', 'aprobada', 'rechazada']
ResultadoValidacion = Literal['coincide', 'inconsistente', 'no_encontrada']
TipoIncapacidad = Literal['enfermedad_general', 'licencia_maternidad', 'licencia_paternidad']

REGEX_DOC = re.compile(r'^\d{6,10}$')
REGEX_NIT = re.compile(r'^\d{9}-?\d$')
REGEX_NUM_INC = re.compile(r'^[A-Z]{2}-\d{4}-\d{6}$')


def _validar_correo(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError('Escribe un correo válido.')
    try:
        res = validate_email(v.strip(), test_environment=True, check_deliverability=False)
        return res.normalized
    except EmailNotValidError as exc:
        raise ValueError('Escribe un correo válido.') from exc


CorreoStr = Annotated[str, BeforeValidator(_validar_correo)]

EPS_VALIDAS = (
    'EPS Simulada Andina',
    'EPS Simulada Caribe',
    'EPS Simulada Pacífico',
)


def validar_politica_password(valor: str) -> str:
    if len(valor) < 8:
        raise ValueError('La contraseña debe tener al menos 8 caracteres.')
    if not any(c.isupper() for c in valor):
        raise ValueError('La contraseña debe incluir al menos una letra mayúscula.')
    if not any(c.isdigit() for c in valor):
        raise ValueError('La contraseña debe incluir al menos un número.')
    return valor


def normalizar_nit(valor: str) -> str:
    limpio = valor.replace('.', '').strip()
    if not REGEX_NIT.match(limpio):
        raise ValueError('El NIT debe tener 9 dígitos y dígito de verificación (ej. 900000111-2).')
    if '-' not in limpio:
        limpio = f'{limpio[:-1]}-{limpio[-1]}'
    return limpio


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    documento: str
    email: str
    rol: Rol
    empresa_id: int | None
    cargo: str | None
    activo: bool
    creado_en: datetime


class EmpresaPublicaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    razon_social: str


class EmpresaOut(BaseModel):
    id: int
    razon_social: str
    nit: str
    ciudad: str
    email_notificaciones: str
    activa: bool
    total_empleados: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal['bearer'] = 'bearer'
    usuario: UsuarioOut


class LoginIn(BaseModel):
    email: CorreoStr
    password: str


class RegistroEmpleadoIn(BaseModel):
    nombre: str = Field(min_length=5, description='Nombre completo')
    documento: str
    email: CorreoStr
    password: str
    empresa_id: int
    acepta_tratamiento_datos: bool

    @field_validator('nombre')
    @classmethod
    def _nombre(cls, v: str) -> str:
        t = v.strip()
        if len(t) < 5:
            raise ValueError('Escribe tu nombre completo (mínimo 5 caracteres).')
        return t

    @field_validator('documento')
    @classmethod
    def _doc(cls, v: str) -> str:
        t = v.strip()
        if not REGEX_DOC.match(t):
            raise ValueError('El documento debe tener entre 6 y 10 dígitos sin puntos.')
        return t

    @field_validator('password')
    @classmethod
    def _pwd(cls, v: str) -> str:
        return validar_politica_password(v)

    @field_validator('acepta_tratamiento_datos')
    @classmethod
    def _datos(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError('Debes autorizar el tratamiento de datos personales.')
        return v


class RegistroEmpresaIn(BaseModel):
    razon_social: str = Field(min_length=4)
    nit: str
    ciudad: str = Field(min_length=2)
    email: CorreoStr
    password: str
    acepta_tratamiento_datos: bool

    @field_validator('razon_social')
    @classmethod
    def _razon(cls, v: str) -> str:
        t = v.strip()
        if len(t) < 4:
            raise ValueError('La razón social debe tener al menos 4 caracteres.')
        return t

    @field_validator('nit')
    @classmethod
    def _nit(cls, v: str) -> str:
        return normalizar_nit(v)

    @field_validator('ciudad')
    @classmethod
    def _ciudad(cls, v: str) -> str:
        t = v.strip()
        if len(t) < 2:
            raise ValueError('Indica la ciudad principal.')
        return t

    @field_validator('password')
    @classmethod
    def _pwd(cls, v: str) -> str:
        return validar_politica_password(v)

    @field_validator('acepta_tratamiento_datos')
    @classmethod
    def _datos(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError('Debes autorizar el tratamiento de datos personales.')
        return v


class CambioPasswordIn(BaseModel):
    password_actual: str
    password_nueva: str

    @field_validator('password_nueva')
    @classmethod
    def _pwd(cls, v: str) -> str:
        return validar_politica_password(v)


class PerfilPatchIn(BaseModel):
    nombre: str | None = None
    cargo: str | None = None

    @field_validator('nombre')
    @classmethod
    def _nombre(cls, v: str | None) -> str | None:
        if v is None:
            return None
        t = v.strip()
        if len(t) < 5:
            raise ValueError('El nombre debe tener al menos 5 caracteres.')
        return t


class CampoValidacionOut(BaseModel):
    campo: Literal['documento', 'tipo', 'fecha_inicio', 'fecha_fin', 'dias', 'eps']
    etiqueta: str
    valor_radicado: str
    valor_eps: str
    coincide: bool


class ValidacionOut(BaseModel):
    resultado: ResultadoValidacion
    porcentaje: int
    campos: list[CampoValidacionOut]
    registro_eps_numero: str | None
    registro_eps_ips: str | None
    validado_en: datetime


class EventoHistorialOut(BaseModel):
    id: int
    fecha: datetime
    actor: str
    accion: str
    detalle: str


class EmpleadoRefOut(BaseModel):
    id: int
    nombre: str
    documento: str
    cargo: str | None


class DocumentoMetaOut(BaseModel):
    nombre: str
    tamano_bytes: int


class SolicitudResumenOut(BaseModel):
    id: int
    radicado: str
    empleado: EmpleadoRefOut
    tipo: TipoIncapacidad
    numero_incapacidad: str
    fecha_inicio: date
    fecha_fin: date
    dias: int
    estado: EstadoSolicitud
    resultado_validacion: ResultadoValidacion | None
    creada_en: datetime


class SolicitudOut(SolicitudResumenOut):
    eps: str
    ips: str
    es_prorroga: bool
    documento: DocumentoMetaOut
    observacion: str | None
    decidida_por: str | None
    decidida_en: datetime | None
    validacion: ValidacionOut | None
    historial: list[EventoHistorialOut]


class PaginaSolicitudesOut(BaseModel):
    items: list[SolicitudResumenOut]
    total: int
    pagina: int
    tamano: int


class DecisionIn(BaseModel):
    estado: Literal['aprobada', 'rechazada']
    observacion: str | None = None

    @model_validator(mode='after')
    def _validar_rechazo(self):
        if self.estado == 'rechazada':
            obs = (self.observacion or '').strip()
            if len(obs) < 10:
                raise ValueError('Para rechazar debes escribir una observación de al menos 10 caracteres.')
            self.observacion = obs
        elif self.observacion is not None:
            self.observacion = self.observacion.strip() or None
        return self


class RegistroEpsIn(BaseModel):
    numero: str
    documento: str
    nombre_paciente: str = Field(min_length=3)
    tipo: TipoIncapacidad
    fecha_inicio: date
    fecha_fin: date
    eps: str
    ips: str = Field(min_length=4)

    @field_validator('numero')
    @classmethod
    def _num(cls, v: str) -> str:
        t = v.strip().upper()
        if not REGEX_NUM_INC.match(t):
            raise ValueError('El número debe tener formato XX-0000-000000 (ej. EG-2026-104521).')
        return t

    @field_validator('documento')
    @classmethod
    def _doc(cls, v: str) -> str:
        t = v.strip()
        if not REGEX_DOC.match(t):
            raise ValueError('El documento debe tener entre 6 y 10 dígitos sin puntos.')
        return t

    @model_validator(mode='after')
    def _fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError('La fecha de finalización no puede ser anterior a la fecha de inicio.')
        return self


class RegistroEpsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    numero: str
    documento: str
    nombre_paciente: str
    tipo: TipoIncapacidad
    fecha_inicio: date
    fecha_fin: date
    dias: int
    eps: str
    ips: str


class CorreoOut(BaseModel):
    id: int
    para: str
    asunto: str
    enviado_en: datetime
    estado: Literal['enviado', 'fallido']
    solicitud_id: int
    radicado: str
    empleado: str
    tipo: TipoIncapacidad
    fecha_inicio: date
    fecha_fin: date
    dias: int
    resultado_validacion: ResultadoValidacion


class NotificacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    mensaje: str
    creada_en: datetime
    leida: bool
    solicitud_id: int | None


class EventoAuditoriaOut(BaseModel):
    id: int
    fecha: datetime
    usuario: str
    rol: Literal['empleado', 'empresa', 'admin', 'sistema']
    accion: str
    objeto: str
    ip: str


class PaginaAuditoriaOut(BaseModel):
    items: list[EventoAuditoriaOut]
    total: int
    pagina: int
    tamano: int


class PanelEmpleadoOut(BaseModel):
    pendientes: int
    aprobadas: int
    rechazadas: int
    dias_aprobados_anio: int


class SemanaTotalOut(BaseModel):
    semana_inicio: str
    total: int


class PanelEmpresaOut(BaseModel):
    pendientes: int
    pendientes_con_alerta: int
    aprobadas: int
    rechazadas: int
    horas_promedio_respuesta: float
    por_semana: list[SemanaTotalOut]
    por_validacion: dict[ResultadoValidacion, int]


class PanelAdminOut(BaseModel):
    usuarios_activos: int
    usuarios_total: int
    usuarios_por_rol: dict[Rol, int]
    empresas: int
    registros_eps: int
    solicitudes: int
    correos_enviados: int


class EstadoServicioOut(BaseModel):
    nombre: str
    estado: Literal['operativo', 'degradado', 'caido']
    detalle: str


class EstadoSistemaOut(BaseModel):
    version: str
    disponibilidad_30d: float
    ultima_copia: datetime
    servicios: list[EstadoServicioOut]


class UsuarioIn(BaseModel):
    nombre: str = Field(min_length=5)
    documento: str
    email: CorreoStr
    rol: Rol
    empresa_id: int | None = None
    cargo: str | None = None

    @field_validator('documento')
    @classmethod
    def _doc(cls, v: str) -> str:
        t = v.strip()
        if not REGEX_DOC.match(t):
            raise ValueError('El documento debe tener entre 6 y 10 dígitos sin puntos.')
        return t

    @model_validator(mode='after')
    def _empresa(self):
        if self.rol != 'admin' and self.empresa_id is None:
            raise ValueError('Debes seleccionar una empresa para este rol.')
        if self.rol == 'admin':
            self.empresa_id = None
        return self


class UsuarioPatchIn(BaseModel):
    rol: Rol | None = None
    activo: bool | None = None
    nombre: str | None = None
    cargo: str | None = None

    @field_validator('nombre')
    @classmethod
    def _nombre(cls, v: str | None) -> str | None:
        if v is None:
            return None
        t = v.strip()
        if len(t) < 5:
            raise ValueError('El nombre debe tener al menos 5 caracteres.')
        return t


class EmpresaIn(BaseModel):
    razon_social: str = Field(min_length=4)
    nit: str
    ciudad: str = Field(min_length=2)
    email_notificaciones: CorreoStr

    @field_validator('nit')
    @classmethod
    def _nit(cls, v: str) -> str:
        return normalizar_nit(v)
