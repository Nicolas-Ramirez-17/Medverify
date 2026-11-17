import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../../components/Icon";
import SolicitudesTable from "../../components/SolicitudesTable";
import { ErrorBox, EstadoPill, Kpi, Loading, Notice, PageHead } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fFecha } from "../../lib/format";

export default function InicioEmpleado() {
  const { usuario } = useAuth();
  const panel = useApi(() => api.panelEmpleado(), []);
  const recientes = useApi(() => api.listarSolicitudes({ tamano: 5 }), []);
  const ultima = recientes.data?.items[0];
  const detalle = useApi(() => (ultima ? api.obtenerSolicitud(ultima.id) : Promise.resolve(null)), [ultima?.id]);

  return (
    <>
      <PageHead title={`Hola, ${usuario!.nombre.split(" ")[0]}`} subtitle="Aquí radicas tus incapacidades médicas y consultas la respuesta de Talento Humano.">
        <Link className="btn primary" to="/empleado/radicar"><Icon name="plus" /> Radicar incapacidad</Link>
      </PageHead>
      {panel.error ? <ErrorBox error={panel.error} onRetry={panel.reload} /> : (
        <div className="kpis">
          <Kpi tone="warn" label="Pendientes de revisión" value={panel.data?.pendientes ?? "–"} />
          <Kpi tone="ok" label="Aprobadas" value={panel.data?.aprobadas ?? "–"} />
          <Kpi tone="bad" label="Rechazadas" value={panel.data?.rechazadas ?? "–"} />
          <Kpi tone="acc" label="Días aprobados en 2026" value={panel.data?.dias_aprobados_anio ?? "–"} />
        </div>
      )}
      <div className="cols">
        <div className="card flush">
          <div className="toolbar" style={{ justifyContent: "space-between" }}><h3>Mis solicitudes recientes</h3><Link className="btn sm" to="/empleado/solicitudes">Ver todas</Link></div>
          {recientes.loading ? <Loading /> : recientes.error ? <ErrorBox error={recientes.error} onRetry={recientes.reload} /> :
            <SolicitudesTable items={recientes.data!.items} vacio="Aún no has radicado incapacidades." />}
        </div>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          {detalle.data && (
            <div className="card">
              <div className="card-head"><h3>Última solicitud</h3><EstadoPill estado={detalle.data.estado} /></div>
              <div className="radicado"><span className="code">{detalle.data.radicado}</span><span className="muted small">{fFecha(detalle.data.fecha_inicio)} → {fFecha(detalle.data.fecha_fin)} · {detalle.data.dias} días</span></div>
              <div style={{ marginTop: 12 }}>
                {detalle.data.estado === "pendiente"
                  ? <Notice tone="warn">Talento Humano aún no ha revisado esta solicitud. Te avisaremos aquí cuando responda.</Notice>
                  : <Notice tone={detalle.data.estado === "aprobada" ? "ok" : "bad"} icon={detalle.data.estado === "aprobada" ? "check" : "x"}>
                      <b>Respuesta de la empresa:</b> {detalle.data.observacion || "Sin observaciones."}
                    </Notice>}
              </div>
              <Link className="btn sm" style={{ marginTop: 12 }} to={`/solicitudes/${detalle.data.id}`}>Ver detalle</Link>
            </div>
          )}
          <div className="card">
            <h3>Antes de radicar</h3>
            <ul className="small" style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 6 }}>
              <li>Ten a mano el <b>certificado de incapacidad en PDF</b> (no se aceptan fotos ni imágenes).</li>
              <li>Copia el <b>número de incapacidad</b> tal como aparece en el certificado de la EPS.</li>
              <li>No necesitas escribir tu diagnóstico: por privacidad, la plataforma no lo solicita.</li>
              <li>Radica dentro de los <b>2 días hábiles</b> siguientes al inicio de la incapacidad (política interna de ejemplo).</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
