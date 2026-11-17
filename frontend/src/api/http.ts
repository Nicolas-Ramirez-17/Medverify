import type { Api } from "./index";
import { ApiError } from "./types";
import { getToken, clearToken } from "../auth/token";

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function qs(params: Record<string, unknown> = {}): string {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = `Error ${res.status}`;
  const fieldErrors: Record<string, string> = {};
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") message = body.detail;
    else if (Array.isArray(body?.detail)) {
      // 422 de FastAPI/Pydantic: [{loc: ["body","email"], msg: "...", type: "..."}]
      for (const e of body.detail) {
        const field = Array.isArray(e.loc) ? String(e.loc[e.loc.length - 1]) : "general";
        fieldErrors[field] = e.msg;
      }
      message = "Revisa los datos marcados.";
    }
  } catch { /* respuesta sin JSON */ }
  if (res.status === 401) message = message === `Error 401` ? "Tu sesión expiró. Inicia sesión de nuevo." : message;
  return new ApiError(res.status, message, fieldErrors);
}

async function request<T>(method: Method, path: string, body?: unknown, opts: { form?: FormData; raw?: boolean; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getToken();
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`;
  let payload: BodyInit | undefined;
  if (opts.form) payload = opts.form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(0, "No hay conexión con el servidor. Verifica que la API esté encendida.");
  }
  if (res.status === 401 && opts.auth !== false) {
    clearToken();
    window.dispatchEvent(new Event("medverify:sesion-expirada")); // AuthContext cierra la sesión
  }
  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  if (opts.raw) return (await res.blob()) as T;
  return (await res.json()) as T;
}

export const httpApi: Api = {
  login: (email, password) => request("POST", "/auth/login", { email, password }, { auth: false }),
  registrarEmpleado: (data) => request("POST", "/auth/registro/empleado", data, { auth: false }),
  registrarEmpresa: (data) => request("POST", "/auth/registro/empresa", data, { auth: false }),
  me: () => request("GET", "/auth/me"),
  cambiarPassword: (password_actual, password_nueva) => request("PUT", "/auth/password", { password_actual, password_nueva }),
  actualizarPerfil: (data) => request("PATCH", "/usuarios/me", data),
  empresasPublicas: () => request("GET", "/empresas/publicas", undefined, { auth: false }),

  panelEmpleado: () => request("GET", "/paneles/empleado"),
  panelEmpresa: () => request("GET", "/paneles/empresa"),
  panelAdmin: () => request("GET", "/paneles/admin"),

  listarSolicitudes: (f = {}) => request("GET", `/solicitudes${qs({ ...f })}`),
  obtenerSolicitud: (id) => request("GET", `/solicitudes/${id}`),
  crearSolicitud: (data, archivo) => {
    const form = new FormData();
    form.set("tipo", data.tipo);
    form.set("numero_incapacidad", data.numero_incapacidad);
    form.set("eps", data.eps);
    form.set("ips", data.ips);
    form.set("fecha_inicio", data.fecha_inicio);
    form.set("fecha_fin", data.fecha_fin);
    form.set("es_prorroga", String(data.es_prorroga));
    if (archivo) form.set("archivo", archivo, archivo.name);
    return request("POST", "/solicitudes", undefined, { form });
  },
  decidirSolicitud: (id, decision) => request("PATCH", `/solicitudes/${id}/decision`, decision),
  // 404 = la solicitud existe pero no tiene archivo (p. ej. datos semilla) → el front muestra la hoja simulada.
  descargarDocumento: (id) => request<Blob>("GET", `/solicitudes/${id}/documento`, undefined, { raw: true })
    .catch((e) => { if (e instanceof ApiError && e.status === 404) return null; throw e; }),

  listarNotificaciones: () => request("GET", "/notificaciones"),
  marcarNotificacionesLeidas: () => request("POST", "/notificaciones/marcar-leidas"),
  listarCorreos: () => request("GET", "/correos"),

  listarUsuarios: (q) => request("GET", `/usuarios${qs({ q })}`),
  crearUsuario: (data) => request("POST", "/usuarios", data),
  actualizarUsuario: (id, data) => request("PATCH", `/usuarios/${id}`, data),
  listarEmpresas: () => request("GET", "/empresas"),
  crearEmpresa: (data) => request("POST", "/empresas", data),
  listarRegistrosEps: (q) => request("GET", `/eps/registros${qs({ q })}`),
  crearRegistroEps: (data) => request("POST", "/eps/registros", data),
  actualizarRegistroEps: (numero, data) => request("PUT", `/eps/registros/${encodeURIComponent(numero)}`, data),
  eliminarRegistroEps: (numero) => request("DELETE", `/eps/registros/${encodeURIComponent(numero)}`),
  listarAuditoria: (q, pagina = 1, tamano = 50) => request("GET", `/auditoria${qs({ q, pagina, tamano })}`),
  estadoSistema: () => request("GET", "/sistema/estado"),
};
