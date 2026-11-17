import { api } from "../../api";
import { ErrorBox, Kpi, Loading, PageHead } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fFechaHora } from "../../lib/format";

const PILL = { operativo: "aprobada", degradado: "pendiente", caido: "rechazada" } as const;
const TXT = { operativo: "Operativo", degradado: "Degradado", caido: "Caído" } as const;

export default function Estado() {
  const r = useApi(() => api.estadoSistema(), []);
  if (r.loading && !r.data) return <Loading />;
  if (r.error) return <ErrorBox error={r.error} onRetry={r.reload} />;
  const e = r.data!;
  const todoOk = e.servicios.every((s) => s.estado === "operativo");
  return (
    <>
      <PageHead title="Estado del sistema" subtitle="Supervisión de los servicios de la plataforma (GET /sistema/estado).">
        <span className={`pill ${todoOk ? "aprobada" : "pendiente"}`}>{todoOk ? "Todos los servicios operativos" : "Hay servicios con problemas"}</span>
      </PageHead>
      <div className="kpis">
        <Kpi tone="ok" label="Disponibilidad últimos 30 días" value={`${e.disponibilidad_30d.toFixed(2).replace(".", ",")} %`} />
        <Kpi tone="acc" label="Meta del SLA del servidor" value="99,9 %" />
        <Kpi tone="info" label="Versión desplegada" value={<span className="mono" style={{ fontSize: "1.3rem" }}>{e.version}</span>} />
        <Kpi label="Última copia de seguridad" value={<span style={{ fontSize: "1.2rem" }}>{fFechaHora(e.ultima_copia)}</span>} />
      </div>
      <div className="status-grid">
        {e.servicios.map((s) => (
          <div key={s.nombre} className="card svc">
            <div className="row"><b>{s.nombre}</b><span className={`pill ${PILL[s.estado]}`}>{TXT[s.estado]}</span></div>
            <span className="muted small">{s.detalle}</span>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Despliegue</h3>
        <dl className="dl" style={{ marginTop: 12 }}>
          <dt>Servidor</dt><dd>VPS en la nube · HTTPS con certificado TLS</dd>
          <dt>Contenedores</dt><dd>Docker Compose: web, api, db, mailpit</dd>
          <dt>Repositorio</dt><dd>GitHub · rama main protegida, cambios por pull request</dd>
          <dt>Seguridad</dt><dd>Contraseñas con hash, JWT para sesiones, PDF solo para usuarios autorizados</dd>
        </dl>
      </div>
    </>
  );
}
