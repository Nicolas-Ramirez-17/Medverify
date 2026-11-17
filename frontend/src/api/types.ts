/**
 * Contrato de datos entre el frontend y la API (FastAPI).
 * Fuente de verdad: docs/openapi.yaml. Si cambias algo aquí, cámbialo también allá (y avisa al equipo).
 * Convenciones: JSON en snake_case · fechas "YYYY-MM-DD" · fechas-hora ISO 8601 con zona (ej. 2026-11-16T19:20:00-05:00).
 */

export type Rol = "empleado" | "empresa" | "admin";
export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada";
export type ResultadoValidacion = "coincide" | "inconsistente" | "no_encontrada";
export type TipoIncapacidad = "enfermedad_general" | "licencia_maternidad" | "licencia_paternidad";

export interface Usuario {
  id: number;
  nombre: string;
  documento: string;
  email: string;
  rol: Rol;
  empresa_id: number | null;
  cargo: string | null;
  activo: boolean;
  creado_en: string;
}

export interface Empresa {
  id: number;
  razon_social: string;
  nit: string;
  ciudad: string;
  email_notificaciones: string;
  activa: boolean;
  total_empleados: number;
}

export interface EmpresaPublica {
  id: number;
  razon_social: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "bearer";
  usuario: Usuario;
}

export interface RegistroEmpleadoIn {
  nombre: string;
  documento: string;
  email: string;
  password: string;
  empresa_id: number;
  acepta_tratamiento_datos: true;
}

export interface RegistroEmpresaIn {
  razon_social: string;
  nit: string;
  ciudad: string;
  email: string;
  password: string;
  acepta_tratamiento_datos: true;
}

export interface CampoValidacion {
  campo: "documento" | "tipo" | "fecha_inicio" | "fecha_fin" | "dias" | "eps";
  etiqueta: string;
  valor_radicado: string;
  valor_eps: string;
  coincide: boolean;
}

export interface Validacion {
  resultado: ResultadoValidacion;
  /** 0–100: campos que coinciden / total de campos comparados */
  porcentaje: number;
  campos: CampoValidacion[];
  registro_eps_numero: string | null;
  registro_eps_ips: string | null;
  validado_en: string;
}

export interface EventoHistorial {
  id: number;
  fecha: string;
  actor: string;
  accion: string;
  detalle: string;
}

export interface EmpleadoRef {
  id: number;
  nombre: string;
  documento: string;
  cargo: string | null;
}

export interface SolicitudResumen {
  id: number;
  radicado: string;
  empleado: EmpleadoRef;
  tipo: TipoIncapacidad;
  numero_incapacidad: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  estado: EstadoSolicitud;
  /** null para el rol empleado: el resultado solo lo ve la empresa */
  resultado_validacion: ResultadoValidacion | null;
  creada_en: string;
}

export interface Solicitud extends SolicitudResumen {
  eps: string;
  ips: string;
  es_prorroga: boolean;
  documento: { nombre: string; tamano_bytes: number };
  observacion: string | null;
  decidida_por: string | null;
  decidida_en: string | null;
  /** null para el rol empleado */
  validacion: Validacion | null;
  historial: EventoHistorial[];
}

export interface NuevaSolicitudIn {
  tipo: TipoIncapacidad;
  numero_incapacidad: string;
  eps: string;
  ips: string;
  fecha_inicio: string;
  fecha_fin: string;
  es_prorroga: boolean;
}

export interface DecisionIn {
  estado: "aprobada" | "rechazada";
  /** obligatoria (mín. 10 caracteres) cuando estado = "rechazada" */
  observacion: string | null;
}

export interface FiltroSolicitudes {
  estado?: EstadoSolicitud;
  validacion?: ResultadoValidacion;
  q?: string;
  orden?: "recientes" | "antiguas";
  pagina?: number;
  tamano?: number;
}

export interface Pagina<T> {
  items: T[];
  total: number;
  pagina: number;
  tamano: number;
}

export interface RegistroEps {
  numero: string;
  documento: string;
  nombre_paciente: string;
  tipo: TipoIncapacidad;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  eps: string;
  ips: string;
}

export type RegistroEpsIn = Omit<RegistroEps, "dias">;

export interface Correo {
  id: number;
  para: string;
  asunto: string;
  enviado_en: string;
  estado: "enviado" | "fallido";
  solicitud_id: number;
  radicado: string;
  empleado: string;
  tipo: TipoIncapacidad;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
  resultado_validacion: ResultadoValidacion;
}

export interface Notificacion {
  id: number;
  mensaje: string;
  creada_en: string;
  leida: boolean;
  solicitud_id: number | null;
}

export interface EventoAuditoria {
  id: number;
  fecha: string;
  usuario: string;
  rol: Rol | "sistema";
  accion: string;
  objeto: string;
  ip: string;
}

export interface PanelEmpleado {
  pendientes: number;
  aprobadas: number;
  rechazadas: number;
  dias_aprobados_anio: number;
}

export interface PanelEmpresa {
  pendientes: number;
  pendientes_con_alerta: number;
  aprobadas: number;
  rechazadas: number;
  horas_promedio_respuesta: number;
  por_semana: { semana_inicio: string; total: number }[];
  por_validacion: Record<ResultadoValidacion, number>;
}

export interface PanelAdmin {
  usuarios_activos: number;
  usuarios_total: number;
  usuarios_por_rol: Record<Rol, number>;
  empresas: number;
  registros_eps: number;
  solicitudes: number;
  correos_enviados: number;
}

export interface EstadoServicio {
  nombre: string;
  estado: "operativo" | "degradado" | "caido";
  detalle: string;
}

export interface EstadoSistema {
  version: string;
  disponibilidad_30d: number;
  ultima_copia: string;
  servicios: EstadoServicio[];
}

export interface UsuarioIn {
  nombre: string;
  documento: string;
  email: string;
  rol: Rol;
  empresa_id: number | null;
  cargo: string | null;
}

export interface UsuarioPatch {
  rol?: Rol;
  activo?: boolean;
  nombre?: string;
  cargo?: string | null;
}

export interface EmpresaIn {
  razon_social: string;
  nit: string;
  ciudad: string;
  email_notificaciones: string;
}

/** Error normalizado del cliente. FastAPI responde {"detail": "..."} o {"detail": [{loc, msg, type}]} (422). */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
