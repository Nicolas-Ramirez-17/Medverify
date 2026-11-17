import { Link } from "react-router-dom";
import { api, type ResultadoValidacion } from "../../api";
import BarChart from "../../components/BarChart";
import { Icon } from "../../components/Icon";
import SolicitudesTable from "../../components/SolicitudesTable";
import { ErrorBox, Kpi, Loading, PageHead } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { VALIDACION_LABEL } from "../../lib/format";

const COLOR: Record<ResultadoValidacion, string> = { coincide: "var(--ok)", inconsistente: "var(--warn)", no_encontrada: "var(--bad)" };

export default function PanelEmpresa() {
  const panel = useApi(() => api.panelEmpresa(), []);
  const cola = useApi(() => api.listarSolicitudes({ estado: "pendiente", orden: "antiguas", tamano: 10 }), []);
  if (panel.loading && !panel.data) return <Loading />;
  if (panel.error) return <ErrorBox error={panel.error} onRetry={panel.reload} />;
  const p = panel.data!;
  const total = Object.values(p.por_validacion).reduce((a, b) => a + b, 0) || 1;

  return (
    <>
      <PageHead title="Panel de incapacidades" subtitle="Resumen de las incapacidades radicadas por los empleados de tu empresa.">
        <Link className="btn primary" to="/empresa/solicitudes"><Icon name="inbox" /> Revisar pendientes</Link>
      </PageHead>
      <div className="kpis">
        <Kpi tone="warn" label="Pendientes por revisar" value={p.pendientes} />
        <Kpi tone="bad" label="Pendientes con alertas de validación" value={p.pendientes_con_alerta} />
        <Kpi tone="ok" label="Aprobadas" value={p.aprobadas} />
        <Kpi tone="info" label="Rechazadas" value={p.rechazadas} />
        <Kpi tone="acc" label="Tiempo medio de respuesta" value={`${p.horas_promedio_respuesta.toFixed(1).replace(".", ",")} h`} />
      </div>
      <div className="cols">
        <div className="card"><div className="card-head"><h3>Radicaciones por semana</h3><span className="muted small">Últimas 8 semanas</span></div><BarChart data={p.por_semana} /></div>
        <div className="card">
          <div className="card-head"><h3>Resultado de la validación con la EPS</h3></div>
          <div className="stack" aria-hidden="true">
            {(Object.keys(COLOR) as ResultadoValidacion[]).map((k) => <i key={k} style={{ width: `${(p.por_validacion[k] / total) * 100}%`, background: COLOR[k] }} />)}
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {(Object.keys(COLOR) as ResultadoValidacion[]).map((k) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span><i style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: COLOR[k], marginRight: 8 }} />{VALIDACION_LABEL[k]}</span>
                <b className="num">{p.por_validacion[k]} <span className="muted small">({Math.round((p.por_validacion[k] / total) * 100)} %)</span></b>
              </div>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 14 }}>La validación compara 6 campos (documento, tipo, inicio, fin, días y EPS). La decisión final siempre es de Talento Humano.</p>
        </div>
      </div>
      <div className="card flush">
        <div className="toolbar" style={{ justifyContent: "space-between" }}><h3>Cola de revisión (más antiguas primero)</h3><Link className="btn sm" to="/empresa/solicitudes">Ver todas</Link></div>
        {cola.loading ? <Loading /> : cola.error ? <ErrorBox error={cola.error} onRetry={cola.reload} /> :
          <SolicitudesTable items={cola.data!.items} mostrarEmpleado mostrarValidacion vacio="No hay solicitudes pendientes. ¡Todo al día!" />}
      </div>
    </>
  );
}
