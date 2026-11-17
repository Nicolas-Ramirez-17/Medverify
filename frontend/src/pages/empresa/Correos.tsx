import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { ErrorBox, Loading, PageHead, ValidacionPill } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fFecha, fFechaHora, TIPO_LABEL } from "../../lib/format";

/**
 * Bandeja de los correos automáticos (GET /correos). En desarrollo el backend los envía por SMTP a Mailpit
 * (http://localhost:8025); esta vista muestra el registro que guarda la API de cada envío.
 */
export default function Correos() {
  const r = useApi(() => api.listarCorreos(), []);
  const [sel, setSel] = useState<number | null>(null);
  if (r.loading && !r.data) return <Loading />;
  if (r.error) return <ErrorBox error={r.error} onRetry={r.reload} />;
  const lista = r.data!;
  const m = lista.find((x) => x.id === sel) ?? lista[0];
  const fallidos = lista.filter((x) => x.estado === "fallido").length;

  return (
    <>
      <PageHead title="Correos de notificación" subtitle={<>Cada radicación genera un correo automático a Talento Humano{m ? <> (<b>{m.para}</b>)</> : null}.</>}>
        <span className={`pill ${fallidos ? "rechazada" : "aprobada"}`}>{fallidos ? `${fallidos} envíos fallidos` : "Servicio SMTP operativo"}</span>
      </PageHead>
      <div className="card flush">
        {!lista.length ? <div className="empty">No hay correos.</div> : (
          <div className="mail">
            <div className="mail-list" role="list">
              {lista.map((x) => (
                <button key={x.id} className="mail-item" role="listitem" aria-current={x.id === m.id} onClick={() => setSel(x.id)}>
                  <b>{x.asunto}</b><span>{x.empleado} · {fFechaHora(x.enviado_en)}</span>
                </button>
              ))}
            </div>
            <div className="mail-body">
              <dl className="mail-meta">
                <dt>De</dt><dd>Medverify &lt;no-responder@medverify.test&gt;</dd>
                <dt>Para</dt><dd>{m.para}</dd>
                <dt>Asunto</dt><dd><b>{m.asunto}</b></dd>
                <dt>Fecha</dt><dd>{fFechaHora(m.enviado_en)}</dd>
                <dt>Estado</dt><dd><span className={`pill ${m.estado === "enviado" ? "aprobada" : "rechazada"}`}>{m.estado}</span></dd>
              </dl>
              <div className="mail-frame">
                <div className="mh">Medverify · Nueva incapacidad radicada</div>
                <div className="mb">
                  <p>Hola, equipo de Talento Humano:</p>
                  <p><b>{m.empleado}</b> radicó una incapacidad médica en la plataforma.</p>
                  <dl className="dl">
                    <dt>Radicado</dt><dd className="mono">{m.radicado}</dd>
                    <dt>Tipo</dt><dd>{TIPO_LABEL[m.tipo]}</dd>
                    <dt>Periodo</dt><dd>{fFecha(m.fecha_inicio)} → {fFecha(m.fecha_fin)} ({m.dias} días)</dd>
                    <dt>Validación EPS</dt><dd><ValidacionPill resultado={m.resultado_validacion} /></dd>
                  </dl>
                  <p>Ingresa al panel para revisar el PDF y aprobar o rechazar la solicitud.</p>
                  <div><Link className="btn primary sm" to={`/solicitudes/${m.solicitud_id}`}>Revisar solicitud</Link></div>
                  <p className="muted small">Este es un mensaje automático. No responda a este correo.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
