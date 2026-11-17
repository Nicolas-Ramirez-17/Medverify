# Medverify · Frontend

React 18 + TypeScript + Vite + React Router. Sin librerías de UI: los estilos están en `src/styles.css`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | instala dependencias (versiones fijas) |
| `npm run dev` | servidor de desarrollo en http://localhost:5173 |
| `npm run typecheck` | revisa tipos sin compilar |
| `npm run build` | revisa tipos y compila a `dist/` |
| `npm run preview` | sirve la compilación en http://localhost:4173 |

## Modo simulado vs. API real

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `VITE_USE_MOCK` | `true` | `true`: API simulada en el navegador. `false`: API real |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | dónde está FastAPI |

| `VITE_BASE` | `/` | ruta de publicación; en GitHub Pages es `/Medverify/` (la pone el workflow) |

Copia `.env.example` a `.env.local` para cambiarlas.

En modo simulado los cambios se guardan en la pestaña (`sessionStorage`) y sobreviven a recargas. El botón **«Reiniciar datos de prueba»** de la banda superior vuelve a los datos iniciales. Los PDF adjuntados no se conservan al recargar.

En la pantalla de radicación (solo modo simulado) hay dos botones de **datos de prueba** que llenan el formulario con un registro real de la EPS simulada y generan un PDF ficticio: uno que coincide y otro con la fecha final alterada.

## Organización del código

```
src/
├── api/
│   ├── types.ts          tipos del contrato (espejo de docs/openapi.yaml)
│   ├── index.ts          interfaz Api + selección mock/real
│   ├── http.ts           cliente fetch: token Bearer, errores FastAPI → ApiError
│   └── mock/             servidor simulado (mismas reglas que el backend) y datos semilla
├── auth/                 AuthContext (sesión, login, registro) y token en sessionStorage
├── components/           Layout, tablas, vista previa del PDF, gráfico, modal, toasts, piezas de UI
├── hooks/useApi.ts       carga de datos con estado de carga/error y recarga
├── lib/
│   ├── format.ts         fechas, etiquetas, días entre fechas
│   ├── reglas.ts         validaciones compartidas y regla de comparación con la EPS
│   └── pdfDePrueba.ts    genera un PDF ficticio para pruebas
├── pages/
│   ├── auth/             Login, Registro
│   ├── empleado/         Inicio, Radicar, MisSolicitudes
│   ├── empresa/          Panel, Solicitudes, Correos
│   ├── admin/            Resumen, Usuarios, Empresas, Eps, Auditoria, Estado
│   ├── SolicitudDetalle.tsx   compartida (empleado / empresa / admin)
│   └── Perfil.tsx
├── App.tsx               rutas y protección por rol
└── styles.css
```

## Rutas

| Ruta | Rol |
|---|---|
| `/login`, `/registro` | público |
| `/empleado`, `/empleado/radicar`, `/empleado/solicitudes` | empleado |
| `/empresa` | empresa |
| `/empresa/solicitudes`, `/empresa/correos` | empresa, admin |
| `/solicitudes/:id`, `/perfil` | cualquiera con sesión |
| `/admin`, `/admin/usuarios`, `/admin/empresas`, `/admin/eps`, `/admin/auditoria`, `/admin/estado` | admin |

Los filtros de la bandeja de RR. HH. viven en la URL (`?estado=pendiente&validacion=inconsistente`), así un enlace lleva exactamente a la misma vista.

## Reglas para el equipo

- Toda llamada a la API pasa por `api` (`src/api/index.ts`). Ningún componente usa `fetch` directo.
- Si cambia el contrato: `docs/openapi.yaml` → `src/api/types.ts` → `http.ts` y `mockApi.ts`, en el mismo pull request.
- Accesibilidad: cada campo con `<label>`, errores junto al campo, foco visible, tablas navegables con teclado, tema claro/oscuro.
