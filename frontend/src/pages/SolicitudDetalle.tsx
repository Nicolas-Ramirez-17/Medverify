import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, ApiError, type Solicitud } from "../api";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "../components/Icon";
import PdfPreview from "../components/PdfPreview";
import { useToast } from "../components/Toast";
import { ErrorBox, EstadoPill, Loading, Modal, Notice, ValidacionPill } from "../components/ui";
import { useApi } from "../hooks/useApi";
import { ESTADO_LABEL, fFecha, fFechaHora, miles, TIPO_LABEL, VALIDACION_LABEL } from "../lib/format";

export default function SolicitudDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const r = useApi(() => api.obtenerSolicitud(Number(id)), [id]);
  const [decision, setDecision] = useState<"aprobada" | "rechazada" | null>(null);
  const esEmpleado = usuario!.rol === "empleado";
  const puedeDecidir = usuario!.rol === "empresa";
  const volver = esEmpleado ? "/empleado/solicitudes" : "/empresa/solicitudes";

  if (r.loading && !r.data) return <Loading />;
  if (r.error) return (
    <div style={{ display: "grid", gap: 12 }}>
      <Link className="btn ghost sm" to={volver} style={{ justifySelf: "start" }}><Icon name="back" /> Volver</Link>
      <ErrorBox error={r.error} onRetry={(r.error as ApiError).status === 404 ? undefined : r.reload} />
    </div>
  );
  const s = r.data!;
  const V = s.validacion;

  return (
    <>
      <div className="page-head">
        <div>
          <Link className="btn ghost sm" to={volver}><Icon name="back" /> Volver</Link>
          <div className="radicado" style={{ marginTop: 10 }}><h1 style={{ fontSize: "1.6rem" }}>Solicitud</h1><span className="code">{s.radicado}</span><EstadoPill estado={s.estado} /></div>
          <p className="muted" style={{ marginTop: 6 }}>Radicada {fFechaHora(s.creada_en)} por {s.empleado.nombre}</p>
        </div>
        {puedeDecidir && s.estado === "pendiente" && (
          <div className="row-actions">
            <button className="btn danger" onClick={() => setDecision("rechazada")}><Icon name="x" /> Rechazar</button>
            <button className="btn ok" onClick={() => setDecision("aprobada")}><Icon name="check" /> Aprobar</button>
          </div>
        )}
      </div>

      <div className="detail">
        <div style={{ display: "grid", gap: 18 }}>
          <div className="card stamp-wrap">
            {s.estado !== "pendiente" && <div className={`stamp ${s.estado}`} key={s.estado}>{ESTADO_LABEL[s.estado]}</div>}
            <h3>Datos radicados</h3>
            <dl className="dl" style={{ marginTop: 14 }}>
              <dt>Empleado</dt><dd><b>{s.empleado.nombre}</b> · CC <span className="mono">{miles(s.empleado.documento)}</span></dd>
              <dt>Cargo</dt><dd>{s.empleado.cargo ?? "—"}</dd>
              <dt>Tipo</dt><dd>{TIPO_LABEL[s.tipo]} {s.es_prorroga && <span className="pill info">Prórroga</span>}</dd>
              <dt>Número</dt><dd className="mono">{s.numero_incapacidad}</dd>
              <dt>EPS · IPS</dt><dd>{s.eps} · {s.ips}</dd>
              <dt>Periodo</dt><dd>{fFecha(s.fecha_inicio)} → {fFecha(s.fecha_fin)} <b>({s.dias} días)</b></dd>
            </dl>
            <div style={{ marginTop: 16 }}>
              {s.estado !== "pendiente" ? (
                <Notice tone={s.estado === "aprobada" ? "ok" : "bad"} icon={s.estado === "aprobada" ? "check" : "x"}>
                  <b>Observación de la empresa</b> ({s.decidida_por}, {fFechaHora(s.decidida_en)}):<br />{s.observacion || "Sin observaciones."}
                </Notice>
              ) : esEmpleado ? <Notice tone="warn">Talento Humano está revisando tu solicitud.</Notice> : null}
            </div>
          </div>

          {V && (
            <div className="card">
              <div className="card-head"><h3>Comparación con la base de datos simulada de la EPS</h3><ValidacionPill resultado={V.resultado} /></div>
              {V.resultado === "no_encontrada" ? (
                <Notice tone="bad">No existe ningún registro con el número <b className="mono">{s.numero_incapacidad}</b> en la EPS simulada. Puede ser un error de digitación del empleado o un certificado no válido.</Notice>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div className="meter" style={{ flex: 1 }} role="meter" aria-valuenow={V.porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Porcentaje de coincidencia">
                      <i style={{ width: `${V.porcentaje}%`, background: V.porcentaje === 100 ? "var(--ok)" : "var(--warn)" }} />
                    </div>
                    <b className="num">{V.porcentaje} %</b>
                  </div>
                  <div className="tbl-wrap">
                    <table className="cmp">
                      <thead><tr><th>Campo</th><th>Radicado por el empleado</th><th>Registro EPS</th><th>Resultado</th></tr></thead>
                      <tbody>
                        {V.campos.map((c) => {
                          const fecha = c.campo === "fecha_inicio" || c.campo === "fecha_fin";
                          return (
                            <tr key={c.campo}>
                              <td>{c.etiqueta}</td>
                              <td>{fecha ? fFecha(c.valor_radicado) : c.valor_radicado}</td>
                              <td>{fecha ? fFecha(c.valor_eps) : c.valor_eps}</td>
                              <td className={c.coincide ? "okc" : "badc"}><span className="mark"><Icon name={c.coincide ? "check" : "x"} width={16} height={16} /> {c.coincide ? "Coincide" : "No coincide"}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <p className="muted small" style={{ marginTop: 10 }}>
                Validado automáticamente el {fFechaHora(V.validado_en)}. Registro fuente: {V.registro_eps_numero ? `${V.registro_eps_numero} · ${V.registro_eps_ips}` : "—"}. La decisión final siempre es de Talento Humano.
              </p>
            </div>
          )}

          <div className="card">
            <h3>Historial de la solicitud</h3>
            <ul className="timeline" style={{ marginTop: 14 }}>
              {[...s.historial].reverse().map((h) => (
                <li key={h.id}><span className="tdot"><i /></span><div><b>{h.accion}</b><span>{h.actor} · {fFechaHora(h.fecha)}</span><div className="small">{h.detalle}</div></div></li>
              ))}
            </ul>
          </div>
        </div>
        <PdfPreview solicitud={s} />
      </div>

      {decision && <DecisionModal solicitud={s} estado={decision} onClose={() => setDecision(null)} onDone={(x) => { r.setData(x); setDecision(null); }} />}
    </>
  );
}

const PRESETS = {
  rechazada: ["Las fechas no coinciden con el certificado de la EPS.", "El número de incapacidad no existe en la EPS. Verifica y radica de nuevo.", "El PDF está incompleto o ilegible."],
  aprobada: ["Soporte completo y coincide con la EPS.", "Aprobada. Se reporta a nómina del periodo."],
};

function DecisionModal({ solicitud, estado, onClose, onDone }: { solicitud: Solicitud; estado: "aprobada" | "rechazada"; onClose: () => void; onDone: (s: Solicitud) => void }) {
  const toast = useToast();
  const [obs, setObs] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const rechazo = estado === "rechazada";
  const V = solicitud.validacion;

  async function confirmar() {
    if (rechazo && obs.trim().length < 10) { setErr("Escribe el motivo del rechazo (mínimo 10 caracteres) para que el empleado sepa qué corregir."); return; }
    setBusy(true); setErr("");
    try {
      const s = await api.decidirSolicitud(solicitud.id, { estado, observacion: obs.trim() || null });
      toast(`${s.radicado} ${rechazo ? "rechazada" : "aprobada"}. El empleado ya puede ver la respuesta.`);
      onDone(s);
    } catch (e) {
      setErr(e instanceof ApiError ? (e.fieldErrors.observacion ?? e.message) : "No se pudo guardar la decisión.");
      setBusy(false);
    }
  }

  return (
    <Modal title={`${rechazo ? "Rechazar" : "Aprobar"} ${solicitud.radicado}`} onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Cancelar</button>
        <button className={`btn ${rechazo ? "danger" : "ok"}`} onClick={confirmar} disabled={busy}>{busy && <span className="spinner" />}{rechazo ? "Rechazar solicitud" : "Aprobar solicitud"}</button>
      </>}>
      {!rechazo && V && V.resultado !== "coincide" && (
        <Notice tone="warn" icon="alert">La validación automática encontró <b>{VALIDACION_LABEL[V.resultado].toLowerCase()}</b>. Verifica el PDF antes de aprobar.</Notice>
      )}
      <div className="field">
        <label htmlFor="m-obs">Observación para el empleado {rechazo ? "(obligatoria)" : "(opcional)"}</label>
        <textarea className={`input ${err ? "invalid" : ""}`} id="m-obs" value={obs} onChange={(e) => setObs(e.target.value)} placeholder={rechazo ? "Explica el motivo y qué debe corregir" : "Mensaje para el empleado"} />
        {err && <div className="err">{err}</div>}
      </div>
      <div className="chips">
        {PRESETS[estado].map((p) => <button key={p} className="chip" type="button" onClick={() => setObs(p)}>{p.length > 46 ? p.slice(0, 44) + "…" : p}</button>)}
      </div>
      <p className="muted small">El empleado verá esta respuesta en su portal y quedará registrada en el historial y en la auditoría.</p>
    </Modal>
  );
}
