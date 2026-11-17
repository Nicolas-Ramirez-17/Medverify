import { useSearchParams } from "react-router-dom";
import { api, type EstadoSolicitud, type ResultadoValidacion } from "../../api";
import SolicitudesTable from "../../components/SolicitudesTable";
import { ErrorBox, Loading, PageHead, Pager } from "../../components/ui";
import { useApi, useDebounced } from "../../hooks/useApi";
import { ESTADO_LABEL, VALIDACION_LABEL } from "../../lib/format";

const TAM = 15;

/** Bandeja de RR. HH. (y vista de supervisión del administrador). Los filtros viven en la URL para poder compartirlos. */
export default function Solicitudes() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const estado = (params.get("estado") ?? "") as EstadoSolicitud | "";
  const validacion = (params.get("validacion") ?? "") as ResultadoValidacion | "";
  const orden = (params.get("orden") ?? "recientes") as "recientes" | "antiguas";
  const pagina = Number(params.get("pagina") ?? 1);
  const qDeb = useDebounced(q);

  const r = useApi(() => api.listarSolicitudes({ q: qDeb || undefined, estado: estado || undefined, validacion: validacion || undefined, orden, pagina, tamano: TAM }),
    [qDeb, estado, validacion, orden, pagina]);

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(params);
    if (v) n.set(k, v); else n.delete(k);
    if (k !== "pagina") n.delete("pagina");
    setParams(n, { replace: true });
  };

  return (
    <>
      <PageHead title="Solicitudes recibidas" subtitle="Haz clic en una fila para revisar el PDF y la comparación con la EPS." />
      <div className="card flush">
        <div className="toolbar">
          <label className="sr" htmlFor="q-search">Buscar</label>
          <input className="input search" id="q-search" placeholder="Buscar por radicado, número, nombre o cédula" value={q} onChange={(e) => set("q", e.target.value)} />
          <label className="sr" htmlFor="q-estado">Estado</label>
          <select className="input" id="q-estado" value={estado} onChange={(e) => set("estado", e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="sr" htmlFor="q-val">Validación</label>
          <select className="input" id="q-val" value={validacion} onChange={(e) => set("validacion", e.target.value)}>
            <option value="">Toda validación</option>
            {Object.entries(VALIDACION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <label className="sr" htmlFor="q-orden">Orden</label>
          <select className="input" id="q-orden" value={orden} onChange={(e) => set("orden", e.target.value === "recientes" ? "" : e.target.value)}>
            <option value="recientes">Más recientes primero</option>
            <option value="antiguas">Más antiguas primero</option>
          </select>
          {r.data && <span className="muted small" aria-live="polite">{r.data.total} resultado{r.data.total === 1 ? "" : "s"}</span>}
        </div>
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <>
            <SolicitudesTable items={r.data!.items} mostrarEmpleado mostrarValidacion vacio="Ninguna solicitud coincide con los filtros." />
            <Pager pagina={pagina} tamano={TAM} total={r.data!.total} onChange={(p) => set("pagina", String(p))} />
          </>
        )}
      </div>
    </>
  );
}
