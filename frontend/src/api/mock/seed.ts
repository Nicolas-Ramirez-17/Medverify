/**
 * Datos ficticios para el modo simulado (VITE_USE_MOCK=true).
 * El backend puede usar estos mismos datos como semilla de PostgreSQL (ver docs/seed.sql).
 * Ningún dato corresponde a personas, empresas ni EPS reales.
 */
import type { EstadoSolicitud, RegistroEps, Rol, TipoIncapacidad } from "../types";

export interface MockUsuario {
  id: number; nombre: string; documento: string; email: string; rol: Rol; empresa_id: number | null; cargo: string | null; activo: boolean; creado_en: string;
  password: string; // SOLO en el mock. El backend guarda hash (bcrypt/argon2), nunca texto plano.
}
export interface MockEmpresa { id: number; razon_social: string; nit: string; ciudad: string; email_notificaciones: string; activa: boolean }
export interface MockSolicitudSeed {
  radicado: string; usuario_id: number; numero: string; tipo: TipoIncapacidad; inicio: string; fin: string; eps: string; ips: string;
  prorroga: boolean; radicada: string; estado: EstadoSolicitud; observacion: string; decidida_por: number | null; decidida: string | null;
}

const PASS = "Demo2026*";

export const SEED_EMPRESAS: MockEmpresa[] = [
  { id: 1, razon_social: "Constructora Horizonte S.A.S.", nit: "900000111-2", ciudad: "Bogotá D.C.", email_notificaciones: "talentohumano@horizonte.test", activa: true },
  { id: 2, razon_social: "Empresa Demo Ingeniería S.A.S.", nit: "900000222-3", ciudad: "Medellín", email_notificaciones: "rrhh@demo-ingenieria.test", activa: false },
];

export const SEED_USUARIOS: MockUsuario[] = [
  { id: 1, nombre: "Laura Gómez Pardo", documento: "1023456789", email: "laura.gomez@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Residente de obra", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 2, nombre: "Carlos Andrés Peña", documento: "80123456", email: "carlos.pena@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Maestro de obra", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 3, nombre: "Diana Marcela Ruiz", documento: "1015987654", email: "diana.ruiz@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Auxiliar contable", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 4, nombre: "Jorge Iván Castillo", documento: "79876543", email: "jorge.castillo@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Operador de maquinaria", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 5, nombre: "Natalia Herrera Soto", documento: "1032111222", email: "natalia.herrera@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Arquitecta de diseño", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 6, nombre: "Sebastián Ortiz Lara", documento: "1018555444", email: "sebastian.ortiz@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Topógrafo", activo: true, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 7, nombre: "Paola Andrea Méndez", documento: "52777888", email: "paola.mendez@horizonte.test", rol: "empleado", empresa_id: 1, cargo: "Almacenista", activo: false, creado_en: "2026-09-01T08:00:00-05:00", password: PASS },
  { id: 8, nombre: "María José Aristizábal", documento: "52123987", email: "talentohumano@horizonte.test", rol: "empresa", empresa_id: 1, cargo: "Directora de Talento Humano", activo: true, creado_en: "2026-08-25T08:00:00-05:00", password: PASS },
  { id: 9, nombre: "Andrés Camilo Torres", documento: "1020333444", email: "nomina@horizonte.test", rol: "empresa", empresa_id: 1, cargo: "Analista de nómina", activo: true, creado_en: "2026-08-25T08:00:00-05:00", password: PASS },
  { id: 10, nombre: "Julián Vaca Casallas", documento: "1001222333", email: "admin@medverify.test", rol: "admin", empresa_id: null, cargo: "Administrador de la plataforma", activo: true, creado_en: "2026-08-20T08:00:00-05:00", password: PASS },
];

export const SEED_EPS: RegistroEps[] = [
  { numero: "EG-2026-104521", documento: "1023456789", nombre_paciente: "Laura Gómez Pardo", tipo: "enfermedad_general", fecha_inicio: "2026-09-14", fecha_fin: "2026-09-16", dias: 3, eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte" },
  { numero: "EG-2026-104777", documento: "80123456", nombre_paciente: "Carlos Andrés Peña", tipo: "enfermedad_general", fecha_inicio: "2026-09-22", fecha_fin: "2026-09-26", dias: 5, eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80" },
  { numero: "LM-2026-000318", documento: "1032111222", nombre_paciente: "Natalia Herrera Soto", tipo: "licencia_maternidad", fecha_inicio: "2026-10-01", fecha_fin: "2027-02-04", dias: 127, eps: "EPS Simulada Andina", ips: "IPS Materno Infantil Sur" },
  { numero: "EG-2026-105902", documento: "1015987654", nombre_paciente: "Diana Marcela Ruiz", tipo: "enfermedad_general", fecha_inicio: "2026-10-06", fecha_fin: "2026-10-08", dias: 3, eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero" },
  { numero: "EG-2026-106233", documento: "79876543", nombre_paciente: "Jorge Iván Castillo", tipo: "enfermedad_general", fecha_inicio: "2026-10-13", fecha_fin: "2026-10-22", dias: 10, eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80" },
  { numero: "LP-2026-000144", documento: "1018555444", nombre_paciente: "Sebastián Ortiz Lara", tipo: "licencia_paternidad", fecha_inicio: "2026-10-19", fecha_fin: "2026-11-02", dias: 15, eps: "EPS Simulada Pacífico", ips: "IPS Materno Infantil Sur" },
  { numero: "EG-2026-107410", documento: "1023456789", nombre_paciente: "Laura Gómez Pardo", tipo: "enfermedad_general", fecha_inicio: "2026-10-27", fecha_fin: "2026-10-29", dias: 3, eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte" },
  { numero: "EG-2026-108015", documento: "80123456", nombre_paciente: "Carlos Andrés Peña", tipo: "enfermedad_general", fecha_inicio: "2026-11-04", fecha_fin: "2026-11-06", dias: 3, eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80" },
  { numero: "EG-2026-108560", documento: "1015987654", nombre_paciente: "Diana Marcela Ruiz", tipo: "enfermedad_general", fecha_inicio: "2026-11-09", fecha_fin: "2026-11-11", dias: 3, eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero" },
  { numero: "EG-2026-108911", documento: "79876543", nombre_paciente: "Jorge Iván Castillo", tipo: "enfermedad_general", fecha_inicio: "2026-11-10", fecha_fin: "2026-11-14", dias: 5, eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80" },
  { numero: "EG-2026-109120", documento: "1023456789", nombre_paciente: "Laura Gómez Pardo", tipo: "enfermedad_general", fecha_inicio: "2026-11-13", fecha_fin: "2026-11-17", dias: 5, eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte" },
  { numero: "EG-2026-109377", documento: "1018555444", nombre_paciente: "Sebastián Ortiz Lara", tipo: "enfermedad_general", fecha_inicio: "2026-11-12", fecha_fin: "2026-11-13", dias: 2, eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero" },
  { numero: "EG-2026-109640", documento: "1023456789", nombre_paciente: "Laura Gómez Pardo", tipo: "enfermedad_general", fecha_inicio: "2026-11-16", fecha_fin: "2026-11-18", dias: 3, eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte" },
  { numero: "EG-2026-109502", documento: "52777888", nombre_paciente: "Paola Andrea Méndez", tipo: "enfermedad_general", fecha_inicio: "2026-11-16", fecha_fin: "2026-11-20", dias: 5, eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte" },
];

export const SEED_SOLICITUDES: MockSolicitudSeed[] = [
  { radicado: "INC-2026-00131", usuario_id: 1, numero: "EG-2026-104521", tipo: "enfermedad_general", inicio: "2026-09-14", fin: "2026-09-16", eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte", prorroga: false, radicada: "2026-09-16T08:10:00-05:00", estado: "aprobada", observacion: "Soporte completo y coincide con la EPS.", decidida_por: 8, decidida: "2026-09-17T10:05:00-05:00" },
  { radicado: "INC-2026-00134", usuario_id: 2, numero: "EG-2026-104777", tipo: "enfermedad_general", inicio: "2026-09-22", fin: "2026-09-26", eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80", prorroga: false, radicada: "2026-09-23T09:27:00-05:00", estado: "aprobada", observacion: "Aprobada. Se reporta a nómina del periodo.", decidida_por: 9, decidida: "2026-09-24T11:12:00-05:00" },
  { radicado: "INC-2026-00137", usuario_id: 5, numero: "LM-2026-000318", tipo: "licencia_maternidad", inicio: "2026-10-01", fin: "2027-02-04", eps: "EPS Simulada Andina", ips: "IPS Materno Infantil Sur", prorroga: false, radicada: "2026-10-02T10:34:00-05:00", estado: "aprobada", observacion: "¡Felicitaciones! Licencia registrada por 18 semanas.", decidida_por: 8, decidida: "2026-10-02T12:21:00-05:00" },
  { radicado: "INC-2026-00140", usuario_id: 3, numero: "EG-2026-105902", tipo: "enfermedad_general", inicio: "2026-10-06", fin: "2026-10-09", eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero", prorroga: false, radicada: "2026-10-07T11:51:00-05:00", estado: "rechazada", observacion: "La fecha final no coincide con el certificado de la EPS (8 de octubre). Por favor radica de nuevo con las fechas correctas.", decidida_por: 8, decidida: "2026-10-08T13:28:00-05:00" },
  { radicado: "INC-2026-00142", usuario_id: 4, numero: "EG-2026-106233", tipo: "enfermedad_general", inicio: "2026-10-13", fin: "2026-10-22", eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80", prorroga: false, radicada: "2026-10-14T12:08:00-05:00", estado: "aprobada", observacion: "Aprobada.", decidida_por: 9, decidida: "2026-10-15T14:35:00-05:00" },
  { radicado: "INC-2026-00145", usuario_id: 6, numero: "LP-2026-000144", tipo: "licencia_paternidad", inicio: "2026-10-19", fin: "2026-11-02", eps: "EPS Simulada Pacífico", ips: "IPS Materno Infantil Sur", prorroga: false, radicada: "2026-10-20T13:25:00-05:00", estado: "aprobada", observacion: "Licencia de paternidad de 2 semanas aprobada.", decidida_por: 8, decidida: "2026-10-20T15:42:00-05:00" },
  { radicado: "INC-2026-00148", usuario_id: 1, numero: "EG-2026-107410", tipo: "enfermedad_general", inicio: "2026-10-27", fin: "2026-10-29", eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte", prorroga: false, radicada: "2026-10-28T14:42:00-05:00", estado: "aprobada", observacion: "", decidida_por: 9, decidida: "2026-10-29T10:49:00-05:00" },
  { radicado: "INC-2026-00151", usuario_id: 2, numero: "EG-2026-108015", tipo: "enfermedad_general", inicio: "2026-11-04", fin: "2026-11-06", eps: "EPS Simulada Caribe", ips: "IPS Salud Calle 80", prorroga: false, radicada: "2026-11-05T15:59:00-05:00", estado: "aprobada", observacion: "Aprobada.", decidida_por: 8, decidida: "2026-11-06T11:56:00-05:00" },
  { radicado: "INC-2026-00153", usuario_id: 3, numero: "EG-2026-108560", tipo: "enfermedad_general", inicio: "2026-11-09", fin: "2026-11-11", eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero", prorroga: false, radicada: "2026-11-10T16:16:00-05:00", estado: "pendiente", observacion: "", decidida_por: null, decidida: null },
  { radicado: "INC-2026-00154", usuario_id: 4, numero: "EG-2026-108911", tipo: "enfermedad_general", inicio: "2026-11-10", fin: "2026-11-14", eps: "EPS Simulada Andina", ips: "IPS Salud Calle 80", prorroga: false, radicada: "2026-11-11T08:33:00-05:00", estado: "pendiente", observacion: "", decidida_por: null, decidida: null },
  { radicado: "INC-2026-00156", usuario_id: 6, numero: "EG-2026-109999", tipo: "enfermedad_general", inicio: "2026-11-12", fin: "2026-11-13", eps: "EPS Simulada Pacífico", ips: "IPS Centro Médico Chapinero", prorroga: false, radicada: "2026-11-13T09:50:00-05:00", estado: "pendiente", observacion: "", decidida_por: null, decidida: null },
  { radicado: "INC-2026-00157", usuario_id: 1, numero: "EG-2026-109120", tipo: "enfermedad_general", inicio: "2026-11-13", fin: "2026-11-17", eps: "EPS Simulada Andina", ips: "IPS Clínica del Norte", prorroga: false, radicada: "2026-11-14T11:07:00-05:00", estado: "pendiente", observacion: "", decidida_por: null, decidida: null },
];
