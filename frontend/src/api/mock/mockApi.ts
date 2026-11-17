/**
 * Servidor simulado en memoria. Implementa el MISMO contrato que el backend (incluidos permisos por rol,
 * códigos de error y reglas de validación), para que el frontend se pueda desarrollar y probar sin API.
 * El estado se guarda en sessionStorage: sobrevive a recargas y se borra al cerrar la pestaña
 * (los PDF adjuntados no se guardan; tras recargar se muestra la hoja simulada). Ver reiniciarDatosSimulados().
 */
import type { Api } from "../index";
import {
  ApiError, type Correo, type EventoAuditoria, type EventoHistorial, type Notificacion, type Rol, type Solicitud,
  type SolicitudResumen, type Usuario, type RegistroEps, type Empresa, type Validacion, type EstadoSolicitud,
} from "../types";
import { getToken } from "../../auth/token";
import { diasEntre, parseFecha, isoFecha, nowIso, TIPO_LABEL } from "../../lib/format";
import { RE_CEDULA, RE_EMAIL, RE_NIT, RE_NUMERO_INCAPACIDAD, passwordValida, validarContraEps } from "../../lib/reglas";
import { SEED_EMPRESAS, SEED_EPS, SEED_SOLICITUDES, SEED_USUARIOS, type MockEmpresa, type MockUsuario } from "./seed";

interface MockSolicitud {
  id: number; radicado: string; usuario_id: number; tipo: Solicitud["tipo"]; numero_incapacidad: string; eps: string; ips: string;
  fecha_inicio: string; fecha_fin: string; dias: number; es_prorroga: boolean; documento: { nombre: string; tamano_bytes: number };
  estado: EstadoSolicitud; observacion: string | null; decidida_por: number | null; decidida_en: string | null; creada_en: string;
  validacion: Validacion; historial: EventoHistorial[];
}

// ---------------------------------------------------------------- "base de datos"
const db = {
  usuarios: SEED_USUARIOS.map((u) => ({ ...u })) as MockUsuario[],
  empresas: SEED_EMPRESAS.map((e) => ({ ...e })) as MockEmpresa[],
  eps: SEED_EPS.map((e) => ({ ...e })) as RegistroEps[],
  solicitudes: [] as MockSolicitud[],
  correos: [] as Correo[],
  notificaciones: [] as (Notificacion & { usuario_id: number | null; empresa_id: number | null })[],
  auditoria: [] as EventoAuditoria[],
  pdfs: new Map<number, Blob>(),
  seq: { historial: 1, correo: 1, notif: 1, audit: 1 },
};

const plus = (iso: string, seconds: number) => new Date(new Date(iso).getTime() + seconds * 1000).toISOString();
function audit(u: { nombre: string; rol: Rol } | null, accion: string, objeto: string, fecha = nowIso()) {
  db.auditoria.push({ id: db.seq.audit++, fecha, usuario: u ? u.nombre : "Sistema", rol: u ? u.rol : "sistema", accion, objeto, ip: `10.0.0.${10 + (db.seq.audit % 40)}` });
}
function hist(s: MockSolicitud, actor: string, accion: string, detalle: string, fecha = nowIso()) {
  s.historial.push({ id: db.seq.historial++, fecha, actor, accion, detalle });
}
const VAL_TXT = { coincide: "Coincide con la EPS", inconsistente: "Con inconsistencias", no_encontrada: "No encontrada en la EPS" } as const;

function empresaDe(usuarioId: number) {
  const u = db.usuarios.find((x) => x.id === usuarioId);
  return db.empresas.find((e) => e.id === u?.empresa_id) ?? db.empresas[0];
}
function enviarCorreo(s: MockSolicitud, fecha: string) {
  const emp = empresaDe(s.usuario_id);
  const u = db.usuarios.find((x) => x.id === s.usuario_id)!;
  db.correos.push({
    id: db.seq.correo++, para: emp.email_notificaciones, asunto: `Nueva incapacidad radicada · ${s.radicado}`, enviado_en: fecha, estado: "enviado",
    solicitud_id: s.id, radicado: s.radicado, empleado: u.nombre, tipo: s.tipo, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, dias: s.dias,
    resultado_validacion: s.validacion.resultado,
  });
  hist(s, "Sistema", "Notificación por correo enviada", `A ${emp.email_notificaciones}`, fecha);
  db.notificaciones.push({ id: db.seq.notif++, mensaje: `${u.nombre} radicó ${s.radicado}`, creada_en: fecha, leida: false, solicitud_id: s.id, usuario_id: null, empresa_id: emp.id });
}
function validar(s: MockSolicitud, fecha: string): Validacion {
  const u = db.usuarios.find((x) => x.id === s.usuario_id)!;
  return validarContraEps({ documento: u.documento, tipo: s.tipo, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, eps: s.eps, numero_incapacidad: s.numero_incapacidad }, db.eps, fecha);
}

const STORAGE_KEY = "medverify.mockdb.v1";
function guardar() {
  try {
    const { pdfs: _p, ...rest } = db; void _p;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch { /* sin almacenamiento: el estado vive solo en memoria */ }
}
function cargarGuardado(): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    Object.assign(db, JSON.parse(raw));
    return true;
  } catch { return false; }
}
/** Borra los cambios hechos en el modo simulado y vuelve a los datos semilla. */
export function reiniciarDatosSimulados() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* nada */ }
  location.reload();
}

// semilla: radicación → validación → correo → decisión
if (!cargarGuardado()) sembrar();
function sembrar() {
SEED_SOLICITUDES.forEach((r, i) => {
  const u = db.usuarios.find((x) => x.id === r.usuario_id)!;
  const s: MockSolicitud = {
    id: i + 1, radicado: r.radicado, usuario_id: r.usuario_id, tipo: r.tipo, numero_incapacidad: r.numero, eps: r.eps, ips: r.ips,
    fecha_inicio: r.inicio, fecha_fin: r.fin, dias: diasEntre(r.inicio, r.fin), es_prorroga: r.prorroga,
    documento: { nombre: `incapacidad_${r.numero}.pdf`, tamano_bytes: 180000 + i * 23117 }, estado: r.estado,
    observacion: r.observacion || null, decidida_por: r.decidida_por, decidida_en: r.decidida, creada_en: r.radicada,
    validacion: null as unknown as Validacion, historial: [],
  };
  hist(s, u.nombre, "Radicó la solicitud", `Adjuntó ${s.documento.nombre}`, r.radicada);
  s.validacion = validar(s, plus(r.radicada, 4));
  hist(s, "Sistema", "Validación automática", VAL_TXT[s.validacion.resultado] + (s.validacion.resultado !== "no_encontrada" ? ` (${s.validacion.porcentaje} % de coincidencia)` : ""), plus(r.radicada, 4));
  db.solicitudes.push(s);
  enviarCorreo(s, plus(r.radicada, 9));
  audit(u, "Radicación de incapacidad", s.radicado, r.radicada);
  if (r.decidida_por && r.decidida) {
    const dz = db.usuarios.find((x) => x.id === r.decidida_por)!;
    hist(s, dz.nombre, r.estado === "aprobada" ? "Aprobó la solicitud" : "Rechazó la solicitud", r.observacion || "Sin observaciones", r.decidida);
    audit(dz, r.estado === "aprobada" ? "Aprobación de solicitud" : "Rechazo de solicitud", s.radicado, r.decidida);
    db.notificaciones.push({ id: db.seq.notif++, mensaje: `Tu solicitud ${s.radicado} fue ${r.estado}`, creada_en: r.decidida, leida: true, solicitud_id: s.id, usuario_id: s.usuario_id, empresa_id: null });
  }
});
audit(db.usuarios[9], "Carga de registros en la EPS simulada", `${db.eps.length} registros`, "2026-10-27T09:12:00-05:00");
audit(db.usuarios[9], "Desactivación de usuario", "Paola Andrea Méndez", "2026-11-03T15:40:00-05:00");
}

// ---------------------------------------------------------------- utilidades del "servidor"
const LATENCIA = 250;
function delay<T>(fn: () => T, ms = LATENCIA): Promise<T> {
  return new Promise((resolve, reject) => setTimeout(() => { try { const r = fn(); guardar(); resolve(r); } catch (e) { reject(e); } }, ms));
}
function actual(): MockUsuario {
  const t = getToken();
  const id = t?.startsWith("mock.") ? Number(t.slice(5)) : NaN;
  const u = db.usuarios.find((x) => x.id === id);
  if (!u) throw new ApiError(401, "Tu sesión expiró. Inicia sesión de nuevo.");
  if (!u.activo) throw new ApiError(403, "Tu cuenta está desactivada. Comunícate con el administrador.");
  return u;
}
function exigir(...roles: Rol[]): MockUsuario {
  const u = actual();
  if (!roles.includes(u.rol)) throw new ApiError(403, "No tienes permiso para esta acción.");
  return u;
}
function publico(u: MockUsuario): Usuario {
  const { password: _p, ...rest } = u;
  void _p;
  return { ...rest };
}
function token(u: MockUsuario) {
  return { access_token: `mock.${u.id}`, token_type: "bearer" as const, usuario: publico(u) };
}
function visibles(u: MockUsuario): MockSolicitud[] {
  if (u.rol === "empleado") return db.solicitudes.filter((s) => s.usuario_id === u.id);
  if (u.rol === "empresa") return db.solicitudes.filter((s) => db.usuarios.find((x) => x.id === s.usuario_id)?.empresa_id === u.empresa_id);
  return db.solicitudes;
}
function resumen(s: MockSolicitud, viewer: MockUsuario): SolicitudResumen {
  const e = db.usuarios.find((x) => x.id === s.usuario_id)!;
  return {
    id: s.id, radicado: s.radicado, empleado: { id: e.id, nombre: e.nombre, documento: e.documento, cargo: e.cargo }, tipo: s.tipo,
    numero_incapacidad: s.numero_incapacidad, fecha_inicio: s.fecha_inicio, fecha_fin: s.fecha_fin, dias: s.dias, estado: s.estado,
    resultado_validacion: viewer.rol === "empleado" ? null : s.validacion.resultado, creada_en: s.creada_en,
  };
}
function detalle(s: MockSolicitud, viewer: MockUsuario): Solicitud {
  return {
    ...resumen(s, viewer), eps: s.eps, ips: s.ips, es_prorroga: s.es_prorroga, documento: s.documento, observacion: s.observacion,
    decidida_por: s.decidida_por ? db.usuarios.find((x) => x.id === s.decidida_por)!.nombre : null, decidida_en: s.decidida_en,
    validacion: viewer.rol === "empleado" ? null : s.validacion, historial: [...s.historial].sort((a, b) => a.fecha.localeCompare(b.fecha)),
  };
}
function buscar(s: MockSolicitud, viewer: MockUsuario): MockSolicitud {
  if (!visibles(viewer).includes(s)) throw new ApiError(404, "La solicitud no existe o no tienes acceso a ella.");
  return s;
}
function empresaOut(e: MockEmpresa): Empresa {
  return { ...e, total_empleados: db.usuarios.filter((u) => u.empresa_id === e.id && u.rol === "empleado").length };
}
function siguienteRadicado(): string {
  const max = Math.max(...db.solicitudes.map((s) => Number(s.radicado.slice(-5))));
  return `INC-2026-${String(max + 1).padStart(5, "0")}`;
}

// ---------------------------------------------------------------- implementación del contrato
export const mockApi: Api = {
  login: (email, password) => delay(() => {
    const u = db.usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new ApiError(401, "Correo o contraseña incorrectos.");
    if (!u.activo) throw new ApiError(403, "Tu cuenta está desactivada. Comunícate con el administrador.");
    audit(u, "Inicio de sesión", "");
    return token(u);
  }),
  registrarEmpleado: (d) => delay(() => {
    const fe: Record<string, string> = {};
    if (d.nombre.trim().length < 5) fe.nombre = "Escribe tu nombre completo.";
    if (!RE_CEDULA.test(d.documento)) fe.documento = "La cédula debe tener entre 6 y 10 dígitos, sin puntos.";
    if (!RE_EMAIL.test(d.email)) fe.email = "Escribe un correo válido.";
    if (!passwordValida(d.password)) fe.password = "Usa al menos 8 caracteres, una mayúscula y un número.";
    if (Object.keys(fe).length) throw new ApiError(422, "Revisa los datos marcados.", fe);
    if (db.usuarios.some((x) => x.email.toLowerCase() === d.email.toLowerCase())) throw new ApiError(409, "Ya existe una cuenta con este correo.", { email: "Ya existe una cuenta con este correo. Inicia sesión." });
    const u: MockUsuario = { id: Math.max(...db.usuarios.map((x) => x.id)) + 1, nombre: d.nombre.trim(), documento: d.documento, email: d.email.toLowerCase(), rol: "empleado", empresa_id: d.empresa_id, cargo: null, activo: true, creado_en: nowIso(), password: d.password };
    db.usuarios.push(u); audit(u, "Registro de cuenta", "Empleado");
    return token(u);
  }),
  registrarEmpresa: (d) => delay(() => {
    const fe: Record<string, string> = {};
    if (d.razon_social.trim().length < 4) fe.razon_social = "Escribe la razón social.";
    if (!RE_NIT.test(d.nit.replace(/\./g, ""))) fe.nit = "El NIT debe tener 9 dígitos y el dígito de verificación.";
    if (!RE_EMAIL.test(d.email)) fe.email = "Escribe un correo válido.";
    if (!passwordValida(d.password)) fe.password = "Usa al menos 8 caracteres, una mayúscula y un número.";
    if (Object.keys(fe).length) throw new ApiError(422, "Revisa los datos marcados.", fe);
    if (db.usuarios.some((x) => x.email.toLowerCase() === d.email.toLowerCase())) throw new ApiError(409, "Ya existe una cuenta con este correo.", { email: "Ya existe una cuenta con este correo." });
    const e: MockEmpresa = { id: Math.max(...db.empresas.map((x) => x.id)) + 1, razon_social: d.razon_social.trim(), nit: d.nit, ciudad: d.ciudad || "—", email_notificaciones: d.email.toLowerCase(), activa: true };
    db.empresas.push(e);
    const u: MockUsuario = { id: Math.max(...db.usuarios.map((x) => x.id)) + 1, nombre: `Talento Humano ${e.razon_social.split(" ")[0]}`, documento: d.nit.replace(/\D/g, ""), email: d.email.toLowerCase(), rol: "empresa", empresa_id: e.id, cargo: "Administrador de la empresa", activo: true, creado_en: nowIso(), password: d.password };
    db.usuarios.push(u); audit(u, "Registro de empresa", e.razon_social);
    return token(u);
  }),
  me: () => delay(() => publico(actual()), 80),
  cambiarPassword: (actualPass, nueva) => delay(() => {
    const u = actual();
    if (u.password !== actualPass) throw new ApiError(400, "La contraseña actual no es correcta.", { password_actual: "La contraseña actual no es correcta." });
    if (!passwordValida(nueva)) throw new ApiError(422, "Revisa los datos marcados.", { password_nueva: "Mínimo 8 caracteres, una mayúscula y un número." });
    u.password = nueva; audit(u, "Cambio de contraseña", u.email);
  }),
  actualizarPerfil: (d) => delay(() => {
    const u = actual();
    if (d.nombre !== undefined && d.nombre.trim().length >= 5) u.nombre = d.nombre.trim();
    if (d.cargo !== undefined) u.cargo = d.cargo;
    audit(u, "Actualización de perfil", u.email);
    return publico(u);
  }),
  empresasPublicas: () => delay(() => db.empresas.filter((e) => e.activa).map((e) => ({ id: e.id, razon_social: e.razon_social }))),

  panelEmpleado: () => delay(() => {
    const u = exigir("empleado");
    const mine = visibles(u);
    const c = (s: EstadoSolicitud) => mine.filter((x) => x.estado === s).length;
    return { pendientes: c("pendiente"), aprobadas: c("aprobada"), rechazadas: c("rechazada"), dias_aprobados_anio: mine.filter((x) => x.estado === "aprobada" && x.fecha_inicio.startsWith("2026")).reduce((a, x) => a + x.dias, 0) };
  }),
  panelEmpresa: () => delay(() => {
    const u = exigir("empresa", "admin");
    const R = visibles(u);
    const c = (s: EstadoSolicitud) => R.filter((x) => x.estado === s).length;
    const dec = R.filter((x) => x.decidida_en);
    const horas = dec.length ? dec.reduce((a, x) => a + (new Date(x.decidida_en!).getTime() - new Date(x.creada_en).getTime()) / 3600000, 0) / dec.length : 0;
    // 8 semanas que terminan en la radicación más reciente
    const ultima = new Date(Math.max(...R.map((x) => new Date(x.creada_en).getTime()), Date.now() - 86400000 * 365));
    const fin = new Date(ultima); fin.setHours(23, 59, 59);
    const por_semana = Array.from({ length: 8 }, (_, k) => {
      const hasta = new Date(fin); hasta.setDate(hasta.getDate() - (7 - k) * 7);
      const desde = new Date(hasta); desde.setDate(desde.getDate() - 6); desde.setHours(0, 0, 0);
      return { semana_inicio: isoFecha(desde), total: R.filter((x) => { const t = new Date(x.creada_en).getTime(); return t >= desde.getTime() && t <= hasta.getTime(); }).length };
    });
    const v = (k: Validacion["resultado"]) => R.filter((x) => x.validacion.resultado === k).length;
    return { pendientes: c("pendiente"), pendientes_con_alerta: R.filter((x) => x.estado === "pendiente" && x.validacion.resultado !== "coincide").length, aprobadas: c("aprobada"), rechazadas: c("rechazada"), horas_promedio_respuesta: Math.round(horas * 10) / 10, por_semana, por_validacion: { coincide: v("coincide"), inconsistente: v("inconsistente"), no_encontrada: v("no_encontrada") } };
  }),
  panelAdmin: () => delay(() => {
    exigir("admin");
    const rol = (r: Rol) => db.usuarios.filter((u) => u.rol === r).length;
    return { usuarios_activos: db.usuarios.filter((u) => u.activo).length, usuarios_total: db.usuarios.length, usuarios_por_rol: { empleado: rol("empleado"), empresa: rol("empresa"), admin: rol("admin") }, empresas: db.empresas.length, registros_eps: db.eps.length, solicitudes: db.solicitudes.length, correos_enviados: db.correos.length };
  }),

  listarSolicitudes: (f = {}) => delay(() => {
    const u = actual();
    let list = visibles(u);
    if (f.estado) list = list.filter((s) => s.estado === f.estado);
    if (f.validacion && u.rol !== "empleado") list = list.filter((s) => s.validacion.resultado === f.validacion);
    if (f.q) {
      const t = f.q.toLowerCase();
      list = list.filter((s) => { const e = db.usuarios.find((x) => x.id === s.usuario_id)!; return `${s.radicado} ${s.numero_incapacidad} ${e.nombre} ${e.documento}`.toLowerCase().includes(t); });
    }
    list = [...list].sort((a, b) => (f.orden === "antiguas" ? a.creada_en.localeCompare(b.creada_en) : b.creada_en.localeCompare(a.creada_en)));
    const pagina = f.pagina ?? 1, tamano = f.tamano ?? 20;
    return { items: list.slice((pagina - 1) * tamano, pagina * tamano).map((s) => resumen(s, u)), total: list.length, pagina, tamano };
  }),
  obtenerSolicitud: (id) => delay(() => {
    const u = actual();
    const s = db.solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError(404, "La solicitud no existe o no tienes acceso a ella.");
    buscar(s, u);
    if (u.rol !== "empleado") audit(u, "Consulta de solicitud y PDF", s.radicado);
    return detalle(s, u);
  }),
  crearSolicitud: (d, archivo) => delay(() => {
    const u = exigir("empleado");
    const fe: Record<string, string> = {};
    const num = d.numero_incapacidad.trim().toUpperCase();
    if (!RE_NUMERO_INCAPACIDAD.test(num)) fe.numero_incapacidad = "Usa el formato del certificado, por ejemplo EG-2026-104521.";
    if (d.ips.trim().length < 4) fe.ips = "Escribe el nombre de la IPS que expidió el certificado.";
    if (!d.fecha_inicio) fe.fecha_inicio = "Elige la fecha de inicio.";
    if (!d.fecha_fin) fe.fecha_fin = "Elige la fecha de finalización.";
    if (d.fecha_inicio && d.fecha_fin && parseFecha(d.fecha_fin) < parseFecha(d.fecha_inicio)) fe.fecha_fin = "La fecha final no puede ser anterior a la de inicio.";
    if (!archivo) fe.archivo = "Adjunta el certificado en PDF.";
    if (Object.keys(fe).length) throw new ApiError(422, "Revisa los datos marcados.", fe);
    if (db.solicitudes.some((s) => s.numero_incapacidad === num && s.estado !== "rechazada")) throw new ApiError(409, "Ya existe una solicitud activa con este número de incapacidad.", { numero_incapacidad: "Ya existe una solicitud activa con este número de incapacidad." });
    const ahora = nowIso();
    const s: MockSolicitud = {
      id: Math.max(...db.solicitudes.map((x) => x.id)) + 1, radicado: siguienteRadicado(), usuario_id: u.id, tipo: d.tipo, numero_incapacidad: num, eps: d.eps, ips: d.ips.trim(),
      fecha_inicio: d.fecha_inicio, fecha_fin: d.fecha_fin, dias: diasEntre(d.fecha_inicio, d.fecha_fin), es_prorroga: d.es_prorroga,
      documento: { nombre: archivo!.name, tamano_bytes: archivo!.size }, estado: "pendiente", observacion: null, decidida_por: null, decidida_en: null,
      creada_en: ahora, validacion: null as unknown as Validacion, historial: [],
    };
    db.pdfs.set(s.id, archivo!);
    hist(s, u.nombre, "Radicó la solicitud", `Adjuntó ${s.documento.nombre}`, ahora);
    s.validacion = validar(s, ahora);
    hist(s, "Sistema", "Validación automática", VAL_TXT[s.validacion.resultado] + (s.validacion.resultado !== "no_encontrada" ? ` (${s.validacion.porcentaje} % de coincidencia)` : ""), ahora);
    db.solicitudes.push(s);
    enviarCorreo(s, ahora);
    audit(u, "Radicación de incapacidad", s.radicado);
    return detalle(s, u);
  }, 1200),
  decidirSolicitud: (id, dec) => delay(() => {
    const u = exigir("empresa");
    const s = db.solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError(404, "La solicitud no existe o no tienes acceso a ella.");
    buscar(s, u);
    if (s.estado !== "pendiente") throw new ApiError(409, "Esta solicitud ya fue decidida.");
    const obs = (dec.observacion ?? "").trim();
    if (dec.estado === "rechazada" && obs.length < 10) throw new ApiError(422, "Revisa los datos marcados.", { observacion: "Escribe el motivo del rechazo (mínimo 10 caracteres) para que el empleado sepa qué corregir." });
    s.estado = dec.estado; s.observacion = obs || null; s.decidida_por = u.id; s.decidida_en = nowIso();
    hist(s, u.nombre, dec.estado === "aprobada" ? "Aprobó la solicitud" : "Rechazó la solicitud", obs || "Sin observaciones");
    db.notificaciones.push({ id: db.seq.notif++, mensaje: `Tu solicitud ${s.radicado} fue ${dec.estado}`, creada_en: nowIso(), leida: false, solicitud_id: s.id, usuario_id: s.usuario_id, empresa_id: null });
    audit(u, dec.estado === "aprobada" ? "Aprobación de solicitud" : "Rechazo de solicitud", s.radicado);
    return detalle(s, u);
  }),
  descargarDocumento: (id) => delay(() => {
    const u = actual();
    const s = db.solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError(404, "La solicitud no existe o no tienes acceso a ella.");
    buscar(s, u);
    return db.pdfs.get(id) ?? null;
  }, 120),

  listarNotificaciones: () => delay(() => {
    const u = actual();
    return db.notificaciones.filter((n) => n.usuario_id === u.id || (u.rol === "empresa" && n.empresa_id === u.empresa_id) || (u.rol === "admin" && n.empresa_id !== null))
      .sort((a, b) => b.creada_en.localeCompare(a.creada_en)).slice(0, 20)
      .map(({ usuario_id: _u, empresa_id: _e, ...n }) => { void _u; void _e; return n; });
  }, 100),
  marcarNotificacionesLeidas: () => delay(() => {
    const u = actual();
    db.notificaciones.forEach((n) => { if (n.usuario_id === u.id || (u.rol !== "empleado" && n.empresa_id !== null)) n.leida = true; });
  }, 60),
  listarCorreos: () => delay(() => {
    const u = exigir("empresa", "admin");
    const emp = db.empresas.find((e) => e.id === u.empresa_id);
    return db.correos.filter((c) => u.rol === "admin" || c.para === emp?.email_notificaciones).sort((a, b) => b.enviado_en.localeCompare(a.enviado_en));
  }),

  listarUsuarios: (q) => delay(() => {
    exigir("admin");
    const t = (q ?? "").toLowerCase();
    return db.usuarios.filter((u) => !t || `${u.nombre} ${u.email} ${u.documento}`.toLowerCase().includes(t)).map(publico);
  }),
  crearUsuario: (d) => delay(() => {
    const a = exigir("admin");
    const fe: Record<string, string> = {};
    if (d.nombre.trim().length < 5) fe.nombre = "Escribe el nombre completo.";
    if (!RE_CEDULA.test(d.documento)) fe.documento = "Entre 6 y 10 dígitos, sin puntos.";
    if (!RE_EMAIL.test(d.email)) fe.email = "Escribe un correo válido.";
    if (Object.keys(fe).length) throw new ApiError(422, "Revisa los datos marcados.", fe);
    if (db.usuarios.some((x) => x.email.toLowerCase() === d.email.toLowerCase())) throw new ApiError(409, "Ese correo ya está registrado.", { email: "Ese correo ya está registrado." });
    const u: MockUsuario = { ...d, id: Math.max(...db.usuarios.map((x) => x.id)) + 1, email: d.email.toLowerCase(), empresa_id: d.rol === "admin" ? null : d.empresa_id, activo: true, creado_en: nowIso(), password: "Temporal2026*" };
    db.usuarios.push(u); audit(a, "Creación de usuario", `${u.nombre} (${u.rol})`);
    return publico(u);
  }),
  actualizarUsuario: (id, d) => delay(() => {
    const a = exigir("admin");
    const u = db.usuarios.find((x) => x.id === id);
    if (!u) throw new ApiError(404, "El usuario no existe.");
    if (u.id === a.id && (d.rol !== undefined || d.activo === false)) throw new ApiError(400, "No puedes cambiar tu propio rol ni desactivar tu propia cuenta.");
    if (d.rol && d.rol !== u.rol) { audit(a, "Cambio de rol", `${u.nombre}: ${u.rol} → ${d.rol}`); u.rol = d.rol; if (d.rol === "admin") u.empresa_id = null; }
    if (d.activo !== undefined && d.activo !== u.activo) { u.activo = d.activo; audit(a, d.activo ? "Activación de usuario" : "Desactivación de usuario", u.nombre); }
    if (d.nombre) u.nombre = d.nombre;
    if (d.cargo !== undefined) u.cargo = d.cargo;
    return publico(u);
  }),
  listarEmpresas: () => delay(() => { exigir("admin"); return db.empresas.map(empresaOut); }),
  crearEmpresa: (d) => delay(() => {
    const a = exigir("admin");
    const fe: Record<string, string> = {};
    if (d.razon_social.trim().length < 4) fe.razon_social = "Escribe la razón social.";
    if (!RE_NIT.test(d.nit.replace(/\./g, ""))) fe.nit = "9 dígitos y el dígito de verificación.";
    if (!RE_EMAIL.test(d.email_notificaciones)) fe.email_notificaciones = "Escribe un correo válido.";
    if (Object.keys(fe).length) throw new ApiError(422, "Revisa los datos marcados.", fe);
    const e: MockEmpresa = { ...d, id: Math.max(...db.empresas.map((x) => x.id)) + 1, ciudad: d.ciudad || "—", activa: true };
    db.empresas.push(e); audit(a, "Registro de empresa", e.razon_social);
    return empresaOut(e);
  }),
  listarRegistrosEps: (q) => delay(() => {
    exigir("admin");
    const t = (q ?? "").toLowerCase();
    return db.eps.filter((e) => !t || `${e.numero} ${e.documento} ${e.nombre_paciente}`.toLowerCase().includes(t));
  }),
  crearRegistroEps: (d) => delay(() => {
    const a = exigir("admin");
    const num = d.numero.trim().toUpperCase();
    if (!RE_NUMERO_INCAPACIDAD.test(num)) throw new ApiError(422, "Revisa los datos marcados.", { numero: "Formato EG-2026-000000." });
    if (db.eps.some((e) => e.numero === num)) throw new ApiError(409, "Ese número ya existe.", { numero: "Ese número ya existe." });
    if (parseFecha(d.fecha_fin) < parseFecha(d.fecha_inicio)) throw new ApiError(422, "Revisa los datos marcados.", { fecha_fin: "La fecha final no puede ser anterior a la de inicio." });
    const r: RegistroEps = { ...d, numero: num, dias: diasEntre(d.fecha_inicio, d.fecha_fin) };
    db.eps.push(r); audit(a, "Creación de registro EPS", num);
    return r;
  }),
  actualizarRegistroEps: (numero, d) => delay(() => {
    const a = exigir("admin");
    const r = db.eps.find((e) => e.numero === numero);
    if (!r) throw new ApiError(404, "El registro no existe.");
    if (parseFecha(d.fecha_fin) < parseFecha(d.fecha_inicio)) throw new ApiError(422, "Revisa los datos marcados.", { fecha_fin: "La fecha final no puede ser anterior a la de inicio." });
    Object.assign(r, { ...d, numero, dias: diasEntre(d.fecha_inicio, d.fecha_fin) });
    audit(a, "Edición de registro EPS", numero);
    return r;
  }),
  eliminarRegistroEps: (numero) => delay(() => {
    const a = exigir("admin");
    if (!db.eps.some((e) => e.numero === numero)) throw new ApiError(404, "El registro no existe.");
    db.eps = db.eps.filter((e) => e.numero !== numero);
    audit(a, "Eliminación de registro EPS", numero);
  }),
  listarAuditoria: (q, pagina = 1, tamano = 50) => delay(() => {
    exigir("admin");
    const t = (q ?? "").toLowerCase();
    const list = db.auditoria.filter((a) => !t || `${a.usuario} ${a.accion} ${a.objeto}`.toLowerCase().includes(t)).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { items: list.slice((pagina - 1) * tamano, pagina * tamano), total: list.length, pagina, tamano };
  }),
  estadoSistema: () => delay(() => {
    exigir("admin");
    return {
      version: "0.9.0 (simulado)", disponibilidad_30d: 99.93, ultima_copia: "2026-11-16T03:00:00-05:00",
      servicios: [
        { nombre: "Frontend web (React + TypeScript)", estado: "operativo" as const, detalle: "Respuesta media 180 ms" },
        { nombre: "API (FastAPI)", estado: "operativo" as const, detalle: "Modo simulado: sin API real conectada" },
        { nombre: "Base de datos (PostgreSQL)", estado: "operativo" as const, detalle: "Modo simulado" },
        { nombre: "Correo de notificaciones (SMTP · Mailpit)", estado: "operativo" as const, detalle: `${db.correos.length} enviados · 0 fallidos` },
        { nombre: "Almacenamiento de PDF", estado: "operativo" as const, detalle: `${db.solicitudes.length} archivos` },
        { nombre: "Validación EPS simulada", estado: "operativo" as const, detalle: `${db.eps.length} registros cargados` },
      ],
    };
  }),
};

/** Solo para el botón «Datos de prueba» del formulario de radicación (modo simulado). */
export function registroDePruebaPara(documento: string): RegistroEps | null {
  return db.eps.find((e) => e.documento === documento && !db.solicitudes.some((s) => s.numero_incapacidad === e.numero && s.estado !== "rechazada")) ?? null;
}
export const TIPOS = Object.keys(TIPO_LABEL) as Solicitud["tipo"][];
