import type {
  Correo, DecisionIn, Empresa, EmpresaIn, EmpresaPublica, EstadoSistema, EventoAuditoria, FiltroSolicitudes, NuevaSolicitudIn,
  Notificacion, Pagina, PanelAdmin, PanelEmpleado, PanelEmpresa, RegistroEmpleadoIn, RegistroEmpresaIn, RegistroEps, RegistroEpsIn,
  Solicitud, SolicitudResumen, TokenResponse, Usuario, UsuarioIn, UsuarioPatch,
} from "./types";
import { httpApi } from "./http";
import { mockApi } from "./mock/mockApi";

/**
 * Todas las llamadas del frontend pasan por esta interfaz.
 * - httpApi: habla con el backend real (FastAPI) en VITE_API_URL.
 * - mockApi: servidor simulado en memoria con los mismos datos y reglas, para trabajar sin backend.
 * Cada método indica el endpoint del contrato (docs/openapi.yaml).
 */
export interface Api {
  // Autenticación ------------------------------------------------------------
  /** POST /auth/login */
  login(email: string, password: string): Promise<TokenResponse>;
  /** POST /auth/registro/empleado */
  registrarEmpleado(data: RegistroEmpleadoIn): Promise<TokenResponse>;
  /** POST /auth/registro/empresa */
  registrarEmpresa(data: RegistroEmpresaIn): Promise<TokenResponse>;
  /** GET /auth/me */
  me(): Promise<Usuario>;
  /** PUT /auth/password */
  cambiarPassword(passwordActual: string, passwordNueva: string): Promise<void>;
  /** PATCH /usuarios/me */
  actualizarPerfil(data: { nombre?: string; cargo?: string | null }): Promise<Usuario>;
  /** GET /empresas/publicas (sin autenticación, para el registro) */
  empresasPublicas(): Promise<EmpresaPublica[]>;

  // Paneles ------------------------------------------------------------------
  /** GET /paneles/empleado */
  panelEmpleado(): Promise<PanelEmpleado>;
  /** GET /paneles/empresa */
  panelEmpresa(): Promise<PanelEmpresa>;
  /** GET /paneles/admin */
  panelAdmin(): Promise<PanelAdmin>;

  // Solicitudes de incapacidad -------------------------------------------------
  /** GET /solicitudes */
  listarSolicitudes(filtro?: FiltroSolicitudes): Promise<Pagina<SolicitudResumen>>;
  /** GET /solicitudes/{id} */
  obtenerSolicitud(id: number): Promise<Solicitud>;
  /** POST /solicitudes (multipart/form-data) */
  crearSolicitud(data: NuevaSolicitudIn, archivo: File | null): Promise<Solicitud>;
  /** PATCH /solicitudes/{id}/decision */
  decidirSolicitud(id: number, decision: DecisionIn): Promise<Solicitud>;
  /** GET /solicitudes/{id}/documento → application/pdf. null = el mock no tiene PDF real. */
  descargarDocumento(id: number): Promise<Blob | null>;

  // Notificaciones y correos -----------------------------------------------------
  /** GET /notificaciones */
  listarNotificaciones(): Promise<Notificacion[]>;
  /** POST /notificaciones/marcar-leidas */
  marcarNotificacionesLeidas(): Promise<void>;
  /** GET /correos */
  listarCorreos(): Promise<Correo[]>;

  // Administración -------------------------------------------------------------
  /** GET /usuarios */
  listarUsuarios(q?: string): Promise<Usuario[]>;
  /** POST /usuarios */
  crearUsuario(data: UsuarioIn): Promise<Usuario>;
  /** PATCH /usuarios/{id} */
  actualizarUsuario(id: number, data: UsuarioPatch): Promise<Usuario>;
  /** GET /empresas */
  listarEmpresas(): Promise<Empresa[]>;
  /** POST /empresas */
  crearEmpresa(data: EmpresaIn): Promise<Empresa>;
  /** GET /eps/registros */
  listarRegistrosEps(q?: string): Promise<RegistroEps[]>;
  /** POST /eps/registros */
  crearRegistroEps(data: RegistroEpsIn): Promise<RegistroEps>;
  /** PUT /eps/registros/{numero} */
  actualizarRegistroEps(numero: string, data: RegistroEpsIn): Promise<RegistroEps>;
  /** DELETE /eps/registros/{numero} */
  eliminarRegistroEps(numero: string): Promise<void>;
  /** GET /auditoria */
  listarAuditoria(q?: string, pagina?: number, tamano?: number): Promise<Pagina<EventoAuditoria>>;
  /** GET /sistema/estado */
  estadoSistema(): Promise<EstadoSistema>;
}

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
export const api: Api = USE_MOCK ? mockApi : httpApi;
export * from "./types";
