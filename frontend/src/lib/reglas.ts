/**
 * Reglas de negocio compartidas. El backend DEBE aplicar las mismas reglas (el frontend valida solo para dar
 * retroalimentación inmediata; la validación que cuenta es la del servidor). Ver docs/HANDOFF.md §4.
 */
import type { CampoValidacion, RegistroEps, Validacion } from "../api/types";
import { TIPO_LABEL, diasEntre } from "./format";

export const PDF_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const RE_NUMERO_INCAPACIDAD = /^[A-Z]{2}-\d{4}-\d{6}$/; // ej. EG-2026-104521
export const RE_CEDULA = /^\d{6,10}$/;
export const RE_NIT = /^\d{9}-?\d$/;
export const RE_EMAIL = /^\S+@\S+\.\S+$/;

export function passwordValida(p: string): boolean {
  return p.length >= 8 && /[A-Z]/.test(p) && /\d/.test(p);
}
export function fuerzaPassword(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

/** Revisa extensión, tipo MIME, tamaño y firma "%PDF-" del archivo. Devuelve un mensaje de error o null. */
export async function revisarPdf(file: File): Promise<string | null> {
  if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") return `«${file.name}» no es un PDF. Solo se aceptan certificados en formato PDF.`;
  if (file.size > PDF_MAX_BYTES) return `El archivo pesa ${(file.size / 1048576).toFixed(1)} MB. El máximo permitido es 5 MB.`;
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== "%PDF-") return "El archivo tiene extensión .pdf pero su contenido no es un PDF válido.";
  return null;
}

/**
 * Validación contra la BD simulada de la EPS.
 * 1. Se busca el registro por numero_incapacidad (sin distinguir mayúsculas).
 * 2. Si no existe → "no_encontrada", porcentaje 0.
 * 3. Si existe, se comparan 6 campos: documento del empleado, tipo, fecha_inicio, fecha_fin, dias y eps
 *    (texto sin espacios extremos y sin distinguir mayúsculas).
 * 4. Todos coinciden → "coincide"; alguno no → "inconsistente". porcentaje = coincidencias / 6 × 100 (entero).
 */
export function validarContraEps(
  radicado: { documento: string; tipo: string; fecha_inicio: string; fecha_fin: string; eps: string; numero_incapacidad: string },
  registros: RegistroEps[],
  ahoraIso: string,
): Validacion {
  const rec = registros.find((r) => r.numero.toUpperCase() === radicado.numero_incapacidad.trim().toUpperCase());
  if (!rec) return { resultado: "no_encontrada", porcentaje: 0, campos: [], registro_eps_numero: null, registro_eps_ips: null, validado_en: ahoraIso };
  const norm = (v: string) => v.trim().toLowerCase();
  const campos: CampoValidacion[] = [
    { campo: "documento", etiqueta: "Documento del empleado", valor_radicado: radicado.documento, valor_eps: rec.documento, coincide: false },
    { campo: "tipo", etiqueta: "Tipo de incapacidad", valor_radicado: TIPO_LABEL[radicado.tipo as keyof typeof TIPO_LABEL] ?? radicado.tipo, valor_eps: TIPO_LABEL[rec.tipo], coincide: false },
    { campo: "fecha_inicio", etiqueta: "Fecha de inicio", valor_radicado: radicado.fecha_inicio, valor_eps: rec.fecha_inicio, coincide: false },
    { campo: "fecha_fin", etiqueta: "Fecha de finalización", valor_radicado: radicado.fecha_fin, valor_eps: rec.fecha_fin, coincide: false },
    { campo: "dias", etiqueta: "Días de incapacidad", valor_radicado: String(diasEntre(radicado.fecha_inicio, radicado.fecha_fin)), valor_eps: String(rec.dias), coincide: false },
    { campo: "eps", etiqueta: "EPS", valor_radicado: radicado.eps, valor_eps: rec.eps, coincide: false },
  ].map((c) => ({ ...c, coincide: norm(c.valor_radicado) === norm(c.valor_eps) })) as CampoValidacion[];
  const ok = campos.filter((c) => c.coincide).length;
  return {
    resultado: ok === campos.length ? "coincide" : "inconsistente",
    porcentaje: Math.round((ok / campos.length) * 100),
    campos,
    registro_eps_numero: rec.numero,
    registro_eps_ips: rec.ips,
    validado_en: ahoraIso,
  };
}
