import type { EstadoSolicitud, ResultadoValidacion, Rol, TipoIncapacidad } from "../api/types";

export const TIPO_LABEL: Record<TipoIncapacidad, string> = {
  enfermedad_general: "Enfermedad general",
  licencia_maternidad: "Licencia de maternidad",
  licencia_paternidad: "Licencia de paternidad",
};
export const ESTADO_LABEL: Record<EstadoSolicitud, string> = { pendiente: "Pendiente", aprobada: "Aprobada", rechazada: "Rechazada" };
export const VALIDACION_LABEL: Record<ResultadoValidacion, string> = {
  coincide: "Coincide con la EPS",
  inconsistente: "Con inconsistencias",
  no_encontrada: "No encontrada en la EPS",
};
export const ROL_LABEL: Record<Rol, string> = { empleado: "Empleado", empresa: "Empresa (RR. HH.)", admin: "Administrador" };
/** Catálogo de EPS de la base simulada. Debe coincidir con el que use el backend. */
export const EPS_LIST = ["EPS Simulada Andina", "EPS Simulada Caribe", "EPS Simulada Pacífico"];

const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-11-16" → Date local (sin desfase de zona horaria) */
export function parseFecha(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function isoFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function fFecha(s?: string | null): string {
  if (!s) return "—";
  const d = s.length > 10 ? new Date(s) : parseFecha(s);
  return `${String(d.getDate()).padStart(2, "0")} ${MES[d.getMonth()]} ${d.getFullYear()}`;
}
export function fFechaHora(s?: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  return `${fFecha(s)} · ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
export function mesCorto(s: string): string {
  const d = parseFecha(s);
  return `${String(d.getDate()).padStart(2, "0")} ${MES[d.getMonth()]}`;
}
/** Días calendario entre dos fechas, ambos extremos incluidos. Misma regla que el backend. */
export function diasEntre(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  const n = Math.round((parseFecha(fin).getTime() - parseFecha(inicio).getTime()) / 86400000) + 1;
  return n > 0 ? n : 0;
}
export function hace(s: string): string {
  const h = (Date.now() - new Date(s).getTime()) / 3600000;
  if (h < 1) return "hace minutos";
  if (h < 24) return `hace ${Math.floor(h)} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}
export function miles(n: string | number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
export function tamano(bytes: number): string {
  return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
export function iniciales(nombre: string): string {
  return nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}
export function nowIso(): string {
  return new Date().toISOString();
}
