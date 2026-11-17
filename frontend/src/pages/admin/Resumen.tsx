import { Link } from "react-router-dom";
import { api, type EventoAuditoria, type Rol } from "../../api";
import { Icon } from "../../components/Icon";
import { ErrorBox, Kpi, Loading, PageHead } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fFechaHora, ROL_LABEL } from "../../lib/format";

export function TablaAuditoria({ items }: { items: EventoAuditoria[] }) {
  return (
    <div className="tbl-wrap">
      <table>
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Objeto</th><th>IP</th></tr></thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="small mono">{fFechaHora(a.fecha)}</td>
              <td><b>{a.usuario}</b><div className="muted small">{a.rol === "sistema" ? "Sistema" : ROL_LABEL[a.rol]}</div></td>
              <td>{a.accion}</td><td className="small mono">{a.objeto}</td><td className="small mono muted">{a.ip}</td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={5} className="empty">Sin registros.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export default function ResumenAdmin() {
  const p = useApi(() => api.panelAdmin(), []);
  const aud = useApi(() => api.listarAuditoria(undefined, 1, 6), []);
  if (p.loading && !p.data) return <Loading />;
  if (p.error) return <ErrorBox error={p.error} onRetry={p.reload} />;
  const d = p.data!;
  return (
    <>
      <PageHead title="Consola de administración" subtitle="Usuarios, empresas, base de datos simulada de la EPS y supervisión de la plataforma." />
      <div className="kpis">
        <Kpi tone="acc" label="Usuarios activos" value={<>{d.usuarios_activos}<span className="muted" style={{ fontSize: "1rem" }}> / {d.usuarios_total}</span></>} />
        <Kpi tone="info" label="Empresas registradas" value={d.empresas} />
        <Kpi tone="ok" label="Registros en la EPS simulada" value={d.registros_eps} />
        <Kpi tone="warn" label="Solicitudes en el sistema" value={d.solicitudes} />
        <Kpi label="Correos enviados" value={d.correos_enviados} />
      </div>
      <div className="cols">
        <div className="card flush">
          <div className="toolbar" style={{ justifyContent: "space-between" }}><h3>Actividad reciente</h3><Link className="btn sm" to="/admin/auditoria">Ver auditoría</Link></div>
          {aud.loading ? <Loading /> : aud.error ? <ErrorBox error={aud.error} /> : <TablaAuditoria items={aud.data!.items} />}
        </div>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <div className="card">
            <h3>Usuarios por rol</h3>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              {(Object.keys(ROL_LABEL) as Rol[]).map((r) => (
                <div key={r}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>{ROL_LABEL[r]}</span><b className="num">{d.usuarios_por_rol[r]}</b></div>
                  <div className="meter" style={{ marginTop: 4 }}><i style={{ width: `${(d.usuarios_por_rol[r] / Math.max(1, d.usuarios_total)) * 100}%`, background: "var(--accent)" }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3>Accesos rápidos</h3>
            <div className="row-actions" style={{ marginTop: 12 }}>
              <Link className="btn sm" to="/admin/usuarios?nuevo=1"><Icon name="plus" /> Nuevo usuario</Link>
              <Link className="btn sm" to="/admin/eps?nuevo=1"><Icon name="plus" /> Registro EPS</Link>
              <Link className="btn sm" to="/admin/estado"><Icon name="pulse" /> Estado del sistema</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
