import { useEffect, useState } from "react";
import { api, type Solicitud } from "../api";
import { fFecha, miles, tamano, TIPO_LABEL } from "../lib/format";
import { Icon } from "./Icon";
import { Loading } from "./ui";

/**
 * Vista previa del certificado. Pide GET /solicitudes/{id}/documento (application/pdf) y lo muestra con el visor
 * del navegador. Si no hay PDF real (datos semilla del modo simulado) dibuja una hoja de certificado ficticia.
 */
export default function PdfPreview({ solicitud }: { solicitud: Solicitud }) {
  const [url, setUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "sin-pdf" | "error">("cargando");

  useEffect(() => {
    let vivo = true;
    let creada: string | null = null;
    setEstado("cargando");
    api.descargarDocumento(solicitud.id)
      .then((blob) => {
        if (!vivo) return;
        if (!blob) { setEstado("sin-pdf"); return; }
        creada = URL.createObjectURL(blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }));
        setUrl(creada); setEstado("listo");
      })
      .catch(() => vivo && setEstado("error"));
    return () => { vivo = false; if (creada) URL.revokeObjectURL(creada); };
  }, [solicitud.id]);

  return (
    <div className="doc-view">
      <div className="doc-bar">
        <b style={{ overflowWrap: "anywhere" }}><Icon name="file" width={16} height={16} style={{ verticalAlign: -3 }} /> {solicitud.documento.nombre}</b>
        <span className="muted small">{tamano(solicitud.documento.tamano_bytes)} · acceso solo para usuarios autorizados</span>
      </div>
      {estado === "cargando" && <Loading text="Cargando documento…" />}
      {estado === "listo" && url && (
        <>
          <iframe className="pdf-frame" src={url} title={`Certificado ${solicitud.numero_incapacidad}`} />
          <a className="btn sm" href={url} download={solicitud.documento.nombre} style={{ justifySelf: "center" }}><Icon name="download" /> Descargar PDF</a>
        </>
      )}
      {estado === "error" && <p className="muted small" style={{ textAlign: "center" }}>No se pudo cargar el PDF. Intenta de nuevo más tarde.</p>}
      {estado === "sin-pdf" && <HojaSimulada s={solicitud} />}
    </div>
  );
}

function HojaSimulada({ s }: { s: Solicitud }) {
  return (
    <div className="sheet" role="img" aria-label="Vista previa del certificado de incapacidad (documento de demostración)">
      <div className="sh">
        <div><b>{s.eps}</b><div style={{ fontSize: ".7rem", color: "#5A6E68" }}>Certificado de incapacidad · documento ficticio de prueba</div></div>
        <div style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: ".72rem" }}>N.º {s.numero_incapacidad}<br />Expedido {fFecha(s.fecha_inicio)}</div>
      </div>
      <table>
        <tbody>
          <tr><td>Paciente</td><td><b>{s.empleado.nombre}</b></td></tr>
          <tr><td>Identificación</td><td>CC {miles(s.empleado.documento)}</td></tr>
          <tr><td>Tipo</td><td>{TIPO_LABEL[s.tipo]}</td></tr>
          <tr><td>Origen</td><td>{s.tipo === "enfermedad_general" ? "Común" : "Licencia"}</td></tr>
          <tr><td>Fecha de inicio</td><td>{fFecha(s.fecha_inicio)}</td></tr>
          <tr><td>Fecha de terminación</td><td>{fFecha(s.fecha_fin)}</td></tr>
          <tr><td>Días otorgados</td><td>{s.dias}</td></tr>
          <tr><td>Prórroga</td><td>{s.es_prorroga ? "Sí" : "No"}</td></tr>
          <tr><td>IPS</td><td>{s.ips}</td></tr>
          <tr><td>Diagnóstico</td><td style={{ color: "#8A9B96" }}>Reservado · no se comparte con el empleador</td></tr>
        </tbody>
      </table>
      <div className="water">DOCUMENTO DE DEMOSTRACIÓN — SIN VALIDEZ — DATOS SEMILLA DEL MODO SIMULADO</div>
    </div>
  );
}
