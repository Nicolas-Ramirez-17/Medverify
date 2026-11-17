import { useState } from "react";
import { api } from "../../api";
import { ErrorBox, Loading, PageHead, Pager } from "../../components/ui";
import { useApi, useDebounced } from "../../hooks/useApi";
import { TablaAuditoria } from "./Resumen";

const TAM = 25;

export default function Auditoria() {
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const qd = useDebounced(q);
  const r = useApi(() => api.listarAuditoria(qd || undefined, pagina, TAM), [qd, pagina]);
  return (
    <>
      <PageHead title="Historial y auditoría" subtitle="Registro de las acciones de todos los usuarios: inicios de sesión, radicaciones, decisiones y cambios administrativos." />
      <div className="card flush">
        <div className="toolbar">
          <label className="sr" htmlFor="aud-q">Filtrar</label>
          <input className="input search" id="aud-q" placeholder="Filtrar por usuario, acción o radicado" value={q} onChange={(e) => { setQ(e.target.value); setPagina(1); }} />
          {r.data && <span className="muted small">{r.data.total} eventos</span>}
        </div>
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <>
            <TablaAuditoria items={r.data!.items} />
            <Pager pagina={pagina} tamano={TAM} total={r.data!.total} onChange={setPagina} />
          </>
        )}
      </div>
    </>
  );
}
