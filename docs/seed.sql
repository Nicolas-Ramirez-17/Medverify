-- =====================================================================================
-- Medverify · datos semilla (FICTICIOS) — los mismos del modo simulado del frontend
-- Generado desde frontend/src/api/mock/seed.ts. Ejecutar después de docs/schema.sql.
-- Contraseña de todos los usuarios: Demo2026*  (hash bcrypt, costo 12)
-- =====================================================================================
BEGIN;

INSERT INTO empresas (id, razon_social, nit, ciudad, email_notificaciones, activa) VALUES
  (1, 'Constructora Horizonte S.A.S.', '900000111-2', 'Bogotá D.C.', 'talentohumano@horizonte.test', TRUE),
  (2, 'Empresa Demo Ingeniería S.A.S.', '900000222-3', 'Medellín', 'rrhh@demo-ingenieria.test', FALSE);
SELECT setval('empresas_id_seq', (SELECT max(id) FROM empresas));

INSERT INTO usuarios (id, nombre, documento, email, password_hash, rol, empresa_id, cargo, activo, acepto_tratamiento_datos, creado_en) VALUES
  (1, 'Laura Gómez Pardo', '1023456789', 'laura.gomez@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Residente de obra', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (2, 'Carlos Andrés Peña', '80123456', 'carlos.pena@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Maestro de obra', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (3, 'Diana Marcela Ruiz', '1015987654', 'diana.ruiz@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Auxiliar contable', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (4, 'Jorge Iván Castillo', '79876543', 'jorge.castillo@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Operador de maquinaria', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (5, 'Natalia Herrera Soto', '1032111222', 'natalia.herrera@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Arquitecta de diseño', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (6, 'Sebastián Ortiz Lara', '1018555444', 'sebastian.ortiz@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Topógrafo', TRUE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (7, 'Paola Andrea Méndez', '52777888', 'paola.mendez@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empleado', 1, 'Almacenista', FALSE, '2026-09-01T08:00:00-05:00', '2026-09-01T08:00:00-05:00'),
  (8, 'María José Aristizábal', '52123987', 'talentohumano@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empresa', 1, 'Directora de Talento Humano', TRUE, '2026-08-25T08:00:00-05:00', '2026-08-25T08:00:00-05:00'),
  (9, 'Andrés Camilo Torres', '1020333444', 'nomina@horizonte.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'empresa', 1, 'Analista de nómina', TRUE, '2026-08-25T08:00:00-05:00', '2026-08-25T08:00:00-05:00'),
  (10, 'Julián Vaca Casallas', '1001222333', 'admin@medverify.test', '$2b$12$rNKjIzneje1Q0vkwq48gVuwrJ0OO65DYqqrYjxUgFOx8hy2DOG57W', 'admin', NULL, 'Administrador de la plataforma', TRUE, '2026-08-20T08:00:00-05:00', '2026-08-20T08:00:00-05:00');
SELECT setval('usuarios_id_seq', (SELECT max(id) FROM usuarios));

INSERT INTO registros_eps (numero, documento, nombre_paciente, tipo, fecha_inicio, fecha_fin, eps, ips) VALUES
  ('EG-2026-104521', '1023456789', 'Laura Gómez Pardo', 'enfermedad_general', '2026-09-14', '2026-09-16', 'EPS Simulada Andina', 'IPS Clínica del Norte'),
  ('EG-2026-104777', '80123456', 'Carlos Andrés Peña', 'enfermedad_general', '2026-09-22', '2026-09-26', 'EPS Simulada Caribe', 'IPS Salud Calle 80'),
  ('LM-2026-000318', '1032111222', 'Natalia Herrera Soto', 'licencia_maternidad', '2026-10-01', '2027-02-04', 'EPS Simulada Andina', 'IPS Materno Infantil Sur'),
  ('EG-2026-105902', '1015987654', 'Diana Marcela Ruiz', 'enfermedad_general', '2026-10-06', '2026-10-08', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero'),
  ('EG-2026-106233', '79876543', 'Jorge Iván Castillo', 'enfermedad_general', '2026-10-13', '2026-10-22', 'EPS Simulada Caribe', 'IPS Salud Calle 80'),
  ('LP-2026-000144', '1018555444', 'Sebastián Ortiz Lara', 'licencia_paternidad', '2026-10-19', '2026-11-02', 'EPS Simulada Pacífico', 'IPS Materno Infantil Sur'),
  ('EG-2026-107410', '1023456789', 'Laura Gómez Pardo', 'enfermedad_general', '2026-10-27', '2026-10-29', 'EPS Simulada Andina', 'IPS Clínica del Norte'),
  ('EG-2026-108015', '80123456', 'Carlos Andrés Peña', 'enfermedad_general', '2026-11-04', '2026-11-06', 'EPS Simulada Caribe', 'IPS Salud Calle 80'),
  ('EG-2026-108560', '1015987654', 'Diana Marcela Ruiz', 'enfermedad_general', '2026-11-09', '2026-11-11', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero'),
  ('EG-2026-108911', '79876543', 'Jorge Iván Castillo', 'enfermedad_general', '2026-11-10', '2026-11-14', 'EPS Simulada Caribe', 'IPS Salud Calle 80'),
  ('EG-2026-109120', '1023456789', 'Laura Gómez Pardo', 'enfermedad_general', '2026-11-13', '2026-11-17', 'EPS Simulada Andina', 'IPS Clínica del Norte'),
  ('EG-2026-109377', '1018555444', 'Sebastián Ortiz Lara', 'enfermedad_general', '2026-11-12', '2026-11-13', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero'),
  ('EG-2026-109640', '1023456789', 'Laura Gómez Pardo', 'enfermedad_general', '2026-11-16', '2026-11-18', 'EPS Simulada Andina', 'IPS Clínica del Norte'),
  ('EG-2026-109502', '52777888', 'Paola Andrea Méndez', 'enfermedad_general', '2026-11-16', '2026-11-20', 'EPS Simulada Andina', 'IPS Clínica del Norte');

INSERT INTO solicitudes (id, radicado, usuario_id, tipo, numero_incapacidad, eps, ips, fecha_inicio, fecha_fin, es_prorroga, documento_nombre, documento_ruta, documento_tamano, documento_sha256, estado, observacion, decidida_por, decidida_en, creada_en) VALUES
  (1, 'INC-2026-00131', 1, 'enfermedad_general', 'EG-2026-104521', 'EPS Simulada Andina', 'IPS Clínica del Norte', '2026-09-14', '2026-09-16', FALSE, 'incapacidad_EG-2026-104521.pdf', 'seed/INC-2026-00131.pdf', 180000, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', 'Soporte completo y coincide con la EPS.', 8, '2026-09-17T10:05:00-05:00', '2026-09-16T08:10:00-05:00'),
  (2, 'INC-2026-00134', 2, 'enfermedad_general', 'EG-2026-104777', 'EPS Simulada Caribe', 'IPS Salud Calle 80', '2026-09-22', '2026-09-26', FALSE, 'incapacidad_EG-2026-104777.pdf', 'seed/INC-2026-00134.pdf', 203117, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', 'Aprobada. Se reporta a nómina del periodo.', 9, '2026-09-24T11:12:00-05:00', '2026-09-23T09:27:00-05:00'),
  (3, 'INC-2026-00137', 5, 'licencia_maternidad', 'LM-2026-000318', 'EPS Simulada Andina', 'IPS Materno Infantil Sur', '2026-10-01', '2027-02-04', FALSE, 'incapacidad_LM-2026-000318.pdf', 'seed/INC-2026-00137.pdf', 226234, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', '¡Felicitaciones! Licencia registrada por 18 semanas.', 8, '2026-10-02T12:21:00-05:00', '2026-10-02T10:34:00-05:00'),
  (4, 'INC-2026-00140', 3, 'enfermedad_general', 'EG-2026-105902', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero', '2026-10-06', '2026-10-09', FALSE, 'incapacidad_EG-2026-105902.pdf', 'seed/INC-2026-00140.pdf', 249351, '0000000000000000000000000000000000000000000000000000000000000000', 'rechazada', 'La fecha final no coincide con el certificado de la EPS (8 de octubre). Por favor radica de nuevo con las fechas correctas.', 8, '2026-10-08T13:28:00-05:00', '2026-10-07T11:51:00-05:00'),
  (5, 'INC-2026-00142', 4, 'enfermedad_general', 'EG-2026-106233', 'EPS Simulada Caribe', 'IPS Salud Calle 80', '2026-10-13', '2026-10-22', FALSE, 'incapacidad_EG-2026-106233.pdf', 'seed/INC-2026-00142.pdf', 272468, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', 'Aprobada.', 9, '2026-10-15T14:35:00-05:00', '2026-10-14T12:08:00-05:00'),
  (6, 'INC-2026-00145', 6, 'licencia_paternidad', 'LP-2026-000144', 'EPS Simulada Pacífico', 'IPS Materno Infantil Sur', '2026-10-19', '2026-11-02', FALSE, 'incapacidad_LP-2026-000144.pdf', 'seed/INC-2026-00145.pdf', 295585, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', 'Licencia de paternidad de 2 semanas aprobada.', 8, '2026-10-20T15:42:00-05:00', '2026-10-20T13:25:00-05:00'),
  (7, 'INC-2026-00148', 1, 'enfermedad_general', 'EG-2026-107410', 'EPS Simulada Andina', 'IPS Clínica del Norte', '2026-10-27', '2026-10-29', FALSE, 'incapacidad_EG-2026-107410.pdf', 'seed/INC-2026-00148.pdf', 318702, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', NULL, 9, '2026-10-29T10:49:00-05:00', '2026-10-28T14:42:00-05:00'),
  (8, 'INC-2026-00151', 2, 'enfermedad_general', 'EG-2026-108015', 'EPS Simulada Caribe', 'IPS Salud Calle 80', '2026-11-04', '2026-11-06', FALSE, 'incapacidad_EG-2026-108015.pdf', 'seed/INC-2026-00151.pdf', 341819, '0000000000000000000000000000000000000000000000000000000000000000', 'aprobada', 'Aprobada.', 8, '2026-11-06T11:56:00-05:00', '2026-11-05T15:59:00-05:00'),
  (9, 'INC-2026-00153', 3, 'enfermedad_general', 'EG-2026-108560', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero', '2026-11-09', '2026-11-11', FALSE, 'incapacidad_EG-2026-108560.pdf', 'seed/INC-2026-00153.pdf', 364936, '0000000000000000000000000000000000000000000000000000000000000000', 'pendiente', NULL, NULL, NULL, '2026-11-10T16:16:00-05:00'),
  (10, 'INC-2026-00154', 4, 'enfermedad_general', 'EG-2026-108911', 'EPS Simulada Andina', 'IPS Salud Calle 80', '2026-11-10', '2026-11-14', FALSE, 'incapacidad_EG-2026-108911.pdf', 'seed/INC-2026-00154.pdf', 388053, '0000000000000000000000000000000000000000000000000000000000000000', 'pendiente', NULL, NULL, NULL, '2026-11-11T08:33:00-05:00'),
  (11, 'INC-2026-00156', 6, 'enfermedad_general', 'EG-2026-109999', 'EPS Simulada Pacífico', 'IPS Centro Médico Chapinero', '2026-11-12', '2026-11-13', FALSE, 'incapacidad_EG-2026-109999.pdf', 'seed/INC-2026-00156.pdf', 411170, '0000000000000000000000000000000000000000000000000000000000000000', 'pendiente', NULL, NULL, NULL, '2026-11-13T09:50:00-05:00'),
  (12, 'INC-2026-00157', 1, 'enfermedad_general', 'EG-2026-109120', 'EPS Simulada Andina', 'IPS Clínica del Norte', '2026-11-13', '2026-11-17', FALSE, 'incapacidad_EG-2026-109120.pdf', 'seed/INC-2026-00157.pdf', 434287, '0000000000000000000000000000000000000000000000000000000000000000', 'pendiente', NULL, NULL, NULL, '2026-11-14T11:07:00-05:00');
SELECT setval('solicitudes_id_seq', (SELECT max(id) FROM solicitudes));
-- El próximo radicado será INC-2026-00158
SELECT setval('radicado_seq', 157);

-- Validaciones precalculadas con la misma regla de docs/HANDOFF.md §4 (sirven como casos de prueba esperados)
INSERT INTO validaciones (solicitud_id, resultado, porcentaje, campos, registro_eps_numero, registro_eps_ips, validado_en) VALUES
  (1, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1023456789","valor_eps":"1023456789","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-09-14","valor_eps":"2026-09-14","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-09-16","valor_eps":"2026-09-16","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"3","valor_eps":"3","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Andina","valor_eps":"EPS Simulada Andina","coincide":true}]'::jsonb, 'EG-2026-104521', 'IPS Clínica del Norte', '2026-09-16T13:10:04.000Z'),
  (2, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"80123456","valor_eps":"80123456","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-09-22","valor_eps":"2026-09-22","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-09-26","valor_eps":"2026-09-26","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"5","valor_eps":"5","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Caribe","valor_eps":"EPS Simulada Caribe","coincide":true}]'::jsonb, 'EG-2026-104777', 'IPS Salud Calle 80', '2026-09-23T14:27:04.000Z'),
  (3, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1032111222","valor_eps":"1032111222","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Licencia de maternidad","valor_eps":"Licencia de maternidad","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-10-01","valor_eps":"2026-10-01","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2027-02-04","valor_eps":"2027-02-04","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"127","valor_eps":"127","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Andina","valor_eps":"EPS Simulada Andina","coincide":true}]'::jsonb, 'LM-2026-000318', 'IPS Materno Infantil Sur', '2026-10-02T15:34:04.000Z'),
  (4, 'inconsistente', 67, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1015987654","valor_eps":"1015987654","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-10-06","valor_eps":"2026-10-06","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-10-09","valor_eps":"2026-10-08","coincide":false},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"4","valor_eps":"3","coincide":false},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Pacífico","valor_eps":"EPS Simulada Pacífico","coincide":true}]'::jsonb, 'EG-2026-105902', 'IPS Centro Médico Chapinero', '2026-10-07T16:51:04.000Z'),
  (5, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"79876543","valor_eps":"79876543","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-10-13","valor_eps":"2026-10-13","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-10-22","valor_eps":"2026-10-22","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"10","valor_eps":"10","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Caribe","valor_eps":"EPS Simulada Caribe","coincide":true}]'::jsonb, 'EG-2026-106233', 'IPS Salud Calle 80', '2026-10-14T17:08:04.000Z'),
  (6, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1018555444","valor_eps":"1018555444","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Licencia de paternidad","valor_eps":"Licencia de paternidad","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-10-19","valor_eps":"2026-10-19","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-11-02","valor_eps":"2026-11-02","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"15","valor_eps":"15","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Pacífico","valor_eps":"EPS Simulada Pacífico","coincide":true}]'::jsonb, 'LP-2026-000144', 'IPS Materno Infantil Sur', '2026-10-20T18:25:04.000Z'),
  (7, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1023456789","valor_eps":"1023456789","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-10-27","valor_eps":"2026-10-27","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-10-29","valor_eps":"2026-10-29","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"3","valor_eps":"3","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Andina","valor_eps":"EPS Simulada Andina","coincide":true}]'::jsonb, 'EG-2026-107410', 'IPS Clínica del Norte', '2026-10-28T19:42:04.000Z'),
  (8, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"80123456","valor_eps":"80123456","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-11-04","valor_eps":"2026-11-04","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-11-06","valor_eps":"2026-11-06","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"3","valor_eps":"3","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Caribe","valor_eps":"EPS Simulada Caribe","coincide":true}]'::jsonb, 'EG-2026-108015', 'IPS Salud Calle 80', '2026-11-05T20:59:04.000Z'),
  (9, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1015987654","valor_eps":"1015987654","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-11-09","valor_eps":"2026-11-09","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-11-11","valor_eps":"2026-11-11","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"3","valor_eps":"3","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Pacífico","valor_eps":"EPS Simulada Pacífico","coincide":true}]'::jsonb, 'EG-2026-108560', 'IPS Centro Médico Chapinero', '2026-11-10T21:16:04.000Z'),
  (10, 'inconsistente', 83, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"79876543","valor_eps":"79876543","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-11-10","valor_eps":"2026-11-10","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-11-14","valor_eps":"2026-11-14","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"5","valor_eps":"5","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Andina","valor_eps":"EPS Simulada Caribe","coincide":false}]'::jsonb, 'EG-2026-108911', 'IPS Salud Calle 80', '2026-11-11T13:33:04.000Z'),
  (11, 'no_encontrada', 0, '[]'::jsonb, NULL, NULL, '2026-11-13T14:50:04.000Z'),
  (12, 'coincide', 100, '[{"campo":"documento","etiqueta":"Documento del empleado","valor_radicado":"1023456789","valor_eps":"1023456789","coincide":true},{"campo":"tipo","etiqueta":"Tipo de incapacidad","valor_radicado":"Enfermedad general","valor_eps":"Enfermedad general","coincide":true},{"campo":"fecha_inicio","etiqueta":"Fecha de inicio","valor_radicado":"2026-11-13","valor_eps":"2026-11-13","coincide":true},{"campo":"fecha_fin","etiqueta":"Fecha de finalización","valor_radicado":"2026-11-17","valor_eps":"2026-11-17","coincide":true},{"campo":"dias","etiqueta":"Días de incapacidad","valor_radicado":"5","valor_eps":"5","coincide":true},{"campo":"eps","etiqueta":"EPS","valor_radicado":"EPS Simulada Andina","valor_eps":"EPS Simulada Andina","coincide":true}]'::jsonb, 'EG-2026-109120', 'IPS Clínica del Norte', '2026-11-14T16:07:04.000Z');

INSERT INTO historial (solicitud_id, fecha, actor, accion, detalle) VALUES
  (1, '2026-09-16T08:10:00-05:00', 'Laura Gómez Pardo', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-104521.pdf'),
  (1, '2026-09-16T13:10:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (1, '2026-09-16T13:10:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (1, '2026-09-17T10:05:00-05:00', 'María José Aristizábal', 'Aprobó la solicitud', 'Soporte completo y coincide con la EPS.'),
  (2, '2026-09-23T09:27:00-05:00', 'Carlos Andrés Peña', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-104777.pdf'),
  (2, '2026-09-23T14:27:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (2, '2026-09-23T14:27:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (2, '2026-09-24T11:12:00-05:00', 'Andrés Camilo Torres', 'Aprobó la solicitud', 'Aprobada. Se reporta a nómina del periodo.'),
  (3, '2026-10-02T10:34:00-05:00', 'Natalia Herrera Soto', 'Radicó la solicitud', 'Adjuntó incapacidad_LM-2026-000318.pdf'),
  (3, '2026-10-02T15:34:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (3, '2026-10-02T15:34:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (3, '2026-10-02T12:21:00-05:00', 'María José Aristizábal', 'Aprobó la solicitud', '¡Felicitaciones! Licencia registrada por 18 semanas.'),
  (4, '2026-10-07T11:51:00-05:00', 'Diana Marcela Ruiz', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-105902.pdf'),
  (4, '2026-10-07T16:51:04.000Z', 'Sistema', 'Validación automática', 'Con inconsistencias (67 % de coincidencia)'),
  (4, '2026-10-07T16:51:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (4, '2026-10-08T13:28:00-05:00', 'María José Aristizábal', 'Rechazó la solicitud', 'La fecha final no coincide con el certificado de la EPS (8 de octubre). Por favor radica de nuevo con las fechas correctas.'),
  (5, '2026-10-14T12:08:00-05:00', 'Jorge Iván Castillo', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-106233.pdf'),
  (5, '2026-10-14T17:08:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (5, '2026-10-14T17:08:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (5, '2026-10-15T14:35:00-05:00', 'Andrés Camilo Torres', 'Aprobó la solicitud', 'Aprobada.'),
  (6, '2026-10-20T13:25:00-05:00', 'Sebastián Ortiz Lara', 'Radicó la solicitud', 'Adjuntó incapacidad_LP-2026-000144.pdf'),
  (6, '2026-10-20T18:25:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (6, '2026-10-20T18:25:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (6, '2026-10-20T15:42:00-05:00', 'María José Aristizábal', 'Aprobó la solicitud', 'Licencia de paternidad de 2 semanas aprobada.'),
  (7, '2026-10-28T14:42:00-05:00', 'Laura Gómez Pardo', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-107410.pdf'),
  (7, '2026-10-28T19:42:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (7, '2026-10-28T19:42:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (7, '2026-10-29T10:49:00-05:00', 'Andrés Camilo Torres', 'Aprobó la solicitud', 'Sin observaciones'),
  (8, '2026-11-05T15:59:00-05:00', 'Carlos Andrés Peña', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-108015.pdf'),
  (8, '2026-11-05T20:59:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (8, '2026-11-05T20:59:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (8, '2026-11-06T11:56:00-05:00', 'María José Aristizábal', 'Aprobó la solicitud', 'Aprobada.'),
  (9, '2026-11-10T16:16:00-05:00', 'Diana Marcela Ruiz', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-108560.pdf'),
  (9, '2026-11-10T21:16:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (9, '2026-11-10T21:16:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (10, '2026-11-11T08:33:00-05:00', 'Jorge Iván Castillo', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-108911.pdf'),
  (10, '2026-11-11T13:33:04.000Z', 'Sistema', 'Validación automática', 'Con inconsistencias (83 % de coincidencia)'),
  (10, '2026-11-11T13:33:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (11, '2026-11-13T09:50:00-05:00', 'Sebastián Ortiz Lara', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-109999.pdf'),
  (11, '2026-11-13T14:50:04.000Z', 'Sistema', 'Validación automática', 'No encontrada en la EPS'),
  (11, '2026-11-13T14:50:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test'),
  (12, '2026-11-14T11:07:00-05:00', 'Laura Gómez Pardo', 'Radicó la solicitud', 'Adjuntó incapacidad_EG-2026-109120.pdf'),
  (12, '2026-11-14T16:07:04.000Z', 'Sistema', 'Validación automática', 'Coincide con la EPS (100 % de coincidencia)'),
  (12, '2026-11-14T16:07:09.000Z', 'Sistema', 'Notificación por correo enviada', 'A talentohumano@horizonte.test');

INSERT INTO correos (solicitud_id, para, asunto, enviado_en, estado) VALUES
  (1, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00131', '2026-09-16T13:10:09.000Z', 'enviado'),
  (2, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00134', '2026-09-23T14:27:09.000Z', 'enviado'),
  (3, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00137', '2026-10-02T15:34:09.000Z', 'enviado'),
  (4, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00140', '2026-10-07T16:51:09.000Z', 'enviado'),
  (5, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00142', '2026-10-14T17:08:09.000Z', 'enviado'),
  (6, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00145', '2026-10-20T18:25:09.000Z', 'enviado'),
  (7, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00148', '2026-10-28T19:42:09.000Z', 'enviado'),
  (8, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00151', '2026-11-05T20:59:09.000Z', 'enviado'),
  (9, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00153', '2026-11-10T21:16:09.000Z', 'enviado'),
  (10, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00154', '2026-11-11T13:33:09.000Z', 'enviado'),
  (11, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00156', '2026-11-13T14:50:09.000Z', 'enviado'),
  (12, 'talentohumano@horizonte.test', 'Nueva incapacidad radicada · INC-2026-00157', '2026-11-14T16:07:09.000Z', 'enviado');

INSERT INTO notificaciones (usuario_id, empresa_id, solicitud_id, mensaje, leida, creada_en) VALUES
  (NULL, 1, 1, 'Laura Gómez Pardo radicó INC-2026-00131', TRUE, '2026-09-16T13:10:09.000Z'),
  (1, NULL, 1, 'Tu solicitud INC-2026-00131 fue aprobada', TRUE, '2026-09-17T10:05:00-05:00'),
  (NULL, 1, 2, 'Carlos Andrés Peña radicó INC-2026-00134', TRUE, '2026-09-23T14:27:09.000Z'),
  (2, NULL, 2, 'Tu solicitud INC-2026-00134 fue aprobada', TRUE, '2026-09-24T11:12:00-05:00'),
  (NULL, 1, 3, 'Natalia Herrera Soto radicó INC-2026-00137', TRUE, '2026-10-02T15:34:09.000Z'),
  (5, NULL, 3, 'Tu solicitud INC-2026-00137 fue aprobada', TRUE, '2026-10-02T12:21:00-05:00'),
  (NULL, 1, 4, 'Diana Marcela Ruiz radicó INC-2026-00140', TRUE, '2026-10-07T16:51:09.000Z'),
  (3, NULL, 4, 'Tu solicitud INC-2026-00140 fue rechazada', TRUE, '2026-10-08T13:28:00-05:00'),
  (NULL, 1, 5, 'Jorge Iván Castillo radicó INC-2026-00142', TRUE, '2026-10-14T17:08:09.000Z'),
  (4, NULL, 5, 'Tu solicitud INC-2026-00142 fue aprobada', TRUE, '2026-10-15T14:35:00-05:00'),
  (NULL, 1, 6, 'Sebastián Ortiz Lara radicó INC-2026-00145', TRUE, '2026-10-20T18:25:09.000Z'),
  (6, NULL, 6, 'Tu solicitud INC-2026-00145 fue aprobada', TRUE, '2026-10-20T15:42:00-05:00'),
  (NULL, 1, 7, 'Laura Gómez Pardo radicó INC-2026-00148', TRUE, '2026-10-28T19:42:09.000Z'),
  (1, NULL, 7, 'Tu solicitud INC-2026-00148 fue aprobada', TRUE, '2026-10-29T10:49:00-05:00'),
  (NULL, 1, 8, 'Carlos Andrés Peña radicó INC-2026-00151', TRUE, '2026-11-05T20:59:09.000Z'),
  (2, NULL, 8, 'Tu solicitud INC-2026-00151 fue aprobada', TRUE, '2026-11-06T11:56:00-05:00'),
  (NULL, 1, 9, 'Diana Marcela Ruiz radicó INC-2026-00153', TRUE, '2026-11-10T21:16:09.000Z'),
  (NULL, 1, 10, 'Jorge Iván Castillo radicó INC-2026-00154', TRUE, '2026-11-11T13:33:09.000Z'),
  (NULL, 1, 11, 'Sebastián Ortiz Lara radicó INC-2026-00156', TRUE, '2026-11-13T14:50:09.000Z'),
  (NULL, 1, 12, 'Laura Gómez Pardo radicó INC-2026-00157', TRUE, '2026-11-14T16:07:09.000Z');

INSERT INTO auditoria (fecha, usuario_id, usuario_nombre, rol, accion, objeto, ip) VALUES
  ('2026-09-16T08:10:00-05:00', 1, 'Laura Gómez Pardo', 'empleado', 'Radicación de incapacidad', 'INC-2026-00131', '10.0.0.11'),
  ('2026-09-17T10:05:00-05:00', 8, 'María José Aristizábal', 'empresa', 'Aprobación de solicitud', 'INC-2026-00131', '10.0.0.21'),
  ('2026-09-23T09:27:00-05:00', 2, 'Carlos Andrés Peña', 'empleado', 'Radicación de incapacidad', 'INC-2026-00134', '10.0.0.11'),
  ('2026-09-24T11:12:00-05:00', 9, 'Andrés Camilo Torres', 'empresa', 'Aprobación de solicitud', 'INC-2026-00134', '10.0.0.21'),
  ('2026-10-02T10:34:00-05:00', 5, 'Natalia Herrera Soto', 'empleado', 'Radicación de incapacidad', 'INC-2026-00137', '10.0.0.11'),
  ('2026-10-02T12:21:00-05:00', 8, 'María José Aristizábal', 'empresa', 'Aprobación de solicitud', 'INC-2026-00137', '10.0.0.21'),
  ('2026-10-07T11:51:00-05:00', 3, 'Diana Marcela Ruiz', 'empleado', 'Radicación de incapacidad', 'INC-2026-00140', '10.0.0.11'),
  ('2026-10-08T13:28:00-05:00', 8, 'María José Aristizábal', 'empresa', 'Rechazo de solicitud', 'INC-2026-00140', '10.0.0.21'),
  ('2026-10-14T12:08:00-05:00', 4, 'Jorge Iván Castillo', 'empleado', 'Radicación de incapacidad', 'INC-2026-00142', '10.0.0.11'),
  ('2026-10-15T14:35:00-05:00', 9, 'Andrés Camilo Torres', 'empresa', 'Aprobación de solicitud', 'INC-2026-00142', '10.0.0.21'),
  ('2026-10-20T13:25:00-05:00', 6, 'Sebastián Ortiz Lara', 'empleado', 'Radicación de incapacidad', 'INC-2026-00145', '10.0.0.11'),
  ('2026-10-20T15:42:00-05:00', 8, 'María José Aristizábal', 'empresa', 'Aprobación de solicitud', 'INC-2026-00145', '10.0.0.21'),
  ('2026-10-28T14:42:00-05:00', 1, 'Laura Gómez Pardo', 'empleado', 'Radicación de incapacidad', 'INC-2026-00148', '10.0.0.11'),
  ('2026-10-29T10:49:00-05:00', 9, 'Andrés Camilo Torres', 'empresa', 'Aprobación de solicitud', 'INC-2026-00148', '10.0.0.21'),
  ('2026-11-05T15:59:00-05:00', 2, 'Carlos Andrés Peña', 'empleado', 'Radicación de incapacidad', 'INC-2026-00151', '10.0.0.11'),
  ('2026-11-06T11:56:00-05:00', 8, 'María José Aristizábal', 'empresa', 'Aprobación de solicitud', 'INC-2026-00151', '10.0.0.21'),
  ('2026-11-10T16:16:00-05:00', 3, 'Diana Marcela Ruiz', 'empleado', 'Radicación de incapacidad', 'INC-2026-00153', '10.0.0.11'),
  ('2026-11-11T08:33:00-05:00', 4, 'Jorge Iván Castillo', 'empleado', 'Radicación de incapacidad', 'INC-2026-00154', '10.0.0.11'),
  ('2026-11-13T09:50:00-05:00', 6, 'Sebastián Ortiz Lara', 'empleado', 'Radicación de incapacidad', 'INC-2026-00156', '10.0.0.11'),
  ('2026-11-14T11:07:00-05:00', 1, 'Laura Gómez Pardo', 'empleado', 'Radicación de incapacidad', 'INC-2026-00157', '10.0.0.11'),
  ('2026-10-27T09:12:00-05:00', 10, 'Julián Vaca Casallas', 'admin', 'Carga de registros en la EPS simulada', '14 registros', '10.0.0.5'),
  ('2026-11-03T15:40:00-05:00', 10, 'Julián Vaca Casallas', 'admin', 'Desactivación de usuario', 'Paola Andrea Méndez', '10.0.0.5');

COMMIT;

-- NOTA: las filas de solicitudes semilla apuntan a seed/INC-....pdf. El backend puede generar esos PDF de prueba al arrancar
-- o responder 404 en /documento para ellas (el frontend muestra entonces la hoja simulada).
