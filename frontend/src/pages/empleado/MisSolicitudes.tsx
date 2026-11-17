import { useState } from "react";
import { Link } from "react-router-dom";
import { api, type EstadoSolicitud } from "../../api";
import { Icon } from "../../components/Icon";
import SolicitudesTable from "../../components/SolicitudesTable";
import { Chips, ErrorBox, Loading, PageHead, Pager } from "../../components/ui";
import { useApi } from "../../hooks/useApi";

type Filtro = "todas" | EstadoSolicitud;
const TAM = 10;

export default function MisSolicitudes() {
  const [estado, setEstado] = useState<Filtro>("todas");
  const [pagina, setPagina] = useState(1);
  const r = useApi(() => api.listarSolicitudes({ estado: estado === "todas" ? undefined : estado, pagina, tamano: TAM }), [estado, pagina]);
  return (
    <>
      <PageHead title="Mis solicitudes" subtitle="Consulta el estado de cada incapacidad radicada y la respuesta de la empresa.">
        <Link className="btn primary" to="/empleado/radicar"><Icon name="plus" /> Radicar incapacidad</Link>
      </PageHead>
      <div className="card flush">
        <div className="toolbar">
          <Chips label="Filtrar por estado" value={estado} onChange={(v) => { setEstado(v); setPagina(1); }}
            options={[{ value: "todas", label: "Todas" }, { value: "pendiente", label: "Pendientes" }, { value: "aprobada", label: "Aprobadas" }, { value: "rechazada", label: "Rechazadas" }]} />
          {r.data && <span className="muted small">{r.data.total} resultado{r.data.total === 1 ? "" : "s"}</span>}
        </div>
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <>
            <SolicitudesTable items={r.data!.items} />
            <Pager pagina={pagina} tamano={TAM} total={r.data!.total} onChange={setPagina} />
          </>
        )}
      </div>
    </>
  );
}
