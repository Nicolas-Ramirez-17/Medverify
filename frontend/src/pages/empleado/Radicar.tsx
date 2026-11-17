import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, USE_MOCK, type NuevaSolicitudIn, type Solicitud, type TipoIncapacidad } from "../../api";
import { registroDePruebaPara } from "../../api/mock/mockApi";
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { Field, Notice, PageHead, SubmitButton } from "../../components/ui";
import { diasEntre, EPS_LIST, fFecha, isoFecha, parseFecha, tamano, TIPO_LABEL } from "../../lib/format";
import { pdfDePrueba } from "../../lib/pdfDePrueba";
import { RE_NUMERO_INCAPACIDAD, revisarPdf } from "../../lib/reglas";

const VACIO: NuevaSolicitudIn = { tipo: "enfermedad_general", numero_incapacidad: "", eps: EPS_LIST[0], ips: "", fecha_inicio: "", fecha_fin: "", es_prorroga: false };
const PASOS = ["Guardando la solicitud y el PDF", "Comparando con la base de datos simulada de la EPS", "Enviando correo de aviso a Talento Humano"];

export default function Radicar() {
  const { usuario } = useAuth();
  const toast = useToast();
  const [f, setF] = useState<NuevaSolicitudIn>(VACIO);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const [fase, setFase] = useState<"form" | "enviando" | "listo">("form");
  const [paso, setPaso] = useState(0);
  const [resultado, setResultado] = useState<Solicitud | null>(null);
  const inputFile = useRef<HTMLInputElement>(null);

  // Animación de pasos mientras la API responde
  useEffect(() => {
    if (fase !== "enviando") return;
    setPaso(0);
    const t = setInterval(() => setPaso((p) => Math.min(p + 1, PASOS.length - 1)), 450);
    return () => clearInterval(t);
  }, [fase]);

  const set = <K extends keyof NuevaSolicitudIn>(k: K, v: NuevaSolicitudIn[K]) => { setF((x) => ({ ...x, [k]: v })); setErrores((e) => ({ ...e, [k]: "" })); };
  const dias = diasEntre(f.fecha_inicio, f.fecha_fin);

  async function tomarArchivo(file: File) {
    const err = await revisarPdf(file);
    setErrores((e) => ({ ...e, archivo: err ?? "" }));
    setArchivo(err ? null : file);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault(); setArrastrando(false);
    const file = e.dataTransfer.files[0];
    if (file) tomarArchivo(file);
  }

  function datosDePrueba(conError: boolean) {
    const r = registroDePruebaPara(usuario!.documento);
    if (!r) { toast("No quedan registros de prueba libres para este usuario en la EPS simulada.", "bad"); return; }
    let fin = r.fecha_fin;
    if (conError) { const d = parseFecha(r.fecha_fin); d.setDate(d.getDate() + 1); fin = isoFecha(d); }
    setF({ tipo: r.tipo, numero_incapacidad: r.numero, eps: r.eps, ips: r.ips, fecha_inicio: r.fecha_inicio, fecha_fin: fin, es_prorroga: false });
    setArchivo(pdfDePrueba([`${r.eps} - Certificado de incapacidad`, "DOCUMENTO FICTICIO DE PRUEBA - SIN VALIDEZ", `Numero: ${r.numero}`, `Paciente: ${r.nombre_paciente} - CC ${r.documento}`,
      `Tipo: ${TIPO_LABEL[r.tipo]}`, `Desde ${r.fecha_inicio} hasta ${fin}`, `IPS: ${r.ips}`], `incapacidad_${r.numero}.pdf`));
    setAcepta(true); setErrores({});
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setGeneral("");
    const fe: Record<string, string> = {};
    if (!RE_NUMERO_INCAPACIDAD.test(f.numero_incapacidad.trim().toUpperCase())) fe.numero_incapacidad = "Usa el formato del certificado, por ejemplo EG-2026-104521.";
    if (f.ips.trim().length < 4) fe.ips = "Escribe el nombre de la IPS que expidió el certificado.";
    if (!f.fecha_inicio) fe.fecha_inicio = "Elige la fecha de inicio.";
    if (!f.fecha_fin) fe.fecha_fin = "Elige la fecha de finalización.";
    if (f.fecha_inicio && f.fecha_fin && parseFecha(f.fecha_fin) < parseFecha(f.fecha_inicio)) fe.fecha_fin = "La fecha final no puede ser anterior a la de inicio.";
    if (!archivo) fe.archivo = errores.archivo || "Adjunta el certificado en PDF.";
    if (!acepta) fe.acepta = "Debes aceptar la declaración para radicar.";
    setErrores(fe);
    if (Object.keys(fe).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".input.invalid")?.focus());
      return;
    }
    setFase("enviando");
    try {
      const s = await api.crearSolicitud({ ...f, numero_incapacidad: f.numero_incapacidad.trim().toUpperCase(), ips: f.ips.trim() }, archivo);
      setResultado(s); setFase("listo");
      toast(`Solicitud ${s.radicado} radicada. Talento Humano ya fue notificado.`);
    } catch (err) {
      setFase("form");
      if (err instanceof ApiError) { setErrores(err.fieldErrors); setGeneral(err.message); } else setGeneral("No se pudo radicar la solicitud.");
    }
  }

  function nueva() { setF(VACIO); setArchivo(null); setAcepta(false); setErrores({}); setResultado(null); setFase("form"); }

  if (fase !== "form") {
    const listo = fase === "listo";
    return (
      <>
        <PageHead title={listo ? "Solicitud radicada" : "Radicando tu solicitud…"}
          subtitle={<>{resultado ? <>Radicado <span className="mono">{resultado.radicado}</span> · </> : null}{TIPO_LABEL[f.tipo]} · {dias} días</>} />
        <div className="cols">
          <div className="card stamp-wrap">
            {listo && <div className="stamp pendiente">Radicada</div>}
            <h3>Progreso</h3>
            <div className="process" style={{ marginTop: 14 }}>
              <ol>
                {PASOS.map((t, i) => {
                  const hecho = listo || paso > i;
                  return <li key={t} className={hecho ? "done" : paso === i ? "run" : ""}><span className="dot">{hecho && <Icon name="check" width={12} height={12} strokeWidth={3} />}</span><span>{t}</span></li>;
                })}
              </ol>
            </div>
            {listo && resultado && (
              <>
                <div style={{ marginTop: 18 }}><Notice tone="warn">Tu solicitud quedó en estado <b>Pendiente</b>. Recibirás la respuesta de la empresa en <b>Mis solicitudes</b>.</Notice></div>
                <div className="row-actions" style={{ marginTop: 16 }}>
                  <Link className="btn primary" to={`/solicitudes/${resultado.id}`}>Ver mi solicitud</Link>
                  <button className="btn" onClick={nueva}>Radicar otra</button>
                </div>
              </>
            )}
          </div>
          <div className="card">
            <h3>Resumen</h3>
            <dl className="dl" style={{ marginTop: 12 }}>
              <dt>Número</dt><dd className="mono">{f.numero_incapacidad.toUpperCase()}</dd>
              <dt>EPS</dt><dd>{f.eps}</dd><dt>IPS</dt><dd>{f.ips}</dd>
              <dt>Periodo</dt><dd>{fFecha(f.fecha_inicio)} → {fFecha(f.fecha_fin)}</dd>
              <dt>Prórroga</dt><dd>{f.es_prorroga ? "Sí" : "No"}</dd>
              <dt>Archivo</dt><dd style={{ overflowWrap: "anywhere" }}>{archivo?.name} ({tamano(archivo?.size ?? 0)})</dd>
            </dl>
          </div>
        </div>
      </>
    );
  }

  const inv = (k: string) => (errores[k] ? "invalid" : "");
  return (
    <>
      <PageHead title="Radicar incapacidad" subtitle="Diligencia los datos tal como aparecen en el certificado de la EPS y adjunta el PDF.">
        {USE_MOCK && (
          <div className="row-actions">
            <button className="btn sm" type="button" onClick={() => datosDePrueba(false)}>Datos de prueba: coincide</button>
            <button className="btn sm" type="button" onClick={() => datosDePrueba(true)}>Datos de prueba: con error</button>
          </div>
        )}
      </PageHead>
      <form className="cols" onSubmit={onSubmit} noValidate>
        <div className="card" style={{ display: "grid", gap: 16, alignContent: "start" }}>
          {general && <Notice tone="bad">{general}</Notice>}
          <h3>1. Datos de la incapacidad</h3>
          <div className="grid2">
            <Field id="i-tipo" label="Tipo de incapacidad">
              <select className="input" id="i-tipo" value={f.tipo} onChange={(e) => set("tipo", e.target.value as TipoIncapacidad)}>
                {Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field id="i-num" label="Número de incapacidad" hint="Aparece en la parte superior del certificado." error={errores.numero_incapacidad}>
              <input className={`input mono ${inv("numero_incapacidad")}`} id="i-num" placeholder="EG-2026-000000" value={f.numero_incapacidad}
                onChange={(e) => set("numero_incapacidad", e.target.value)} aria-invalid={!!errores.numero_incapacidad} />
            </Field>
            <Field id="i-eps" label="EPS">
              <select className="input" id="i-eps" value={f.eps} onChange={(e) => set("eps", e.target.value)}>
                {EPS_LIST.map((x) => <option key={x}>{x}</option>)}
              </select>
            </Field>
            <Field id="i-ips" label="IPS que la expidió" error={errores.ips}>
              <input className={`input ${inv("ips")}`} id="i-ips" placeholder="Ej. IPS Clínica del Norte" value={f.ips} onChange={(e) => set("ips", e.target.value)} aria-invalid={!!errores.ips} />
            </Field>
            <Field id="i-ini" label="Fecha de inicio" error={errores.fecha_inicio}>
              <input className={`input ${inv("fecha_inicio")}`} id="i-ini" type="date" value={f.fecha_inicio} onChange={(e) => set("fecha_inicio", e.target.value)} />
            </Field>
            <Field id="i-fin" label="Fecha de finalización" error={errores.fecha_fin}>
              <input className={`input ${inv("fecha_fin")}`} id="i-fin" type="date" value={f.fecha_fin} min={f.fecha_inicio || undefined} onChange={(e) => set("fecha_fin", e.target.value)} />
            </Field>
            <Field id="i-dias" label="Días de incapacidad" hint="Se calcula solo (días calendario, ambos extremos incluidos).">
              <input className="input num" id="i-dias" readOnly value={dias || ""} />
            </Field>
            <div className="field" style={{ alignContent: "end" }}>
              <label className="check"><input type="checkbox" checked={f.es_prorroga} onChange={(e) => set("es_prorroga", e.target.checked)} /><span>Es prórroga de una incapacidad anterior</span></label>
            </div>
          </div>

          <h3>2. Certificado en PDF</h3>
          <input ref={inputFile} type="file" id="i-file" accept="application/pdf,.pdf" className="sr" onChange={(e) => { const x = e.target.files?.[0]; if (x) tomarArchivo(x); e.target.value = ""; }} />
          {archivo ? (
            <div className="file-chip">
              <span className="pdf">PDF</span>
              <div style={{ flex: 1, minWidth: 0 }}><b style={{ overflowWrap: "anywhere" }}>{archivo.name}</b><div className="muted small">{tamano(archivo.size)} · verificado como PDF</div></div>
              <button className="btn ghost sm" type="button" onClick={() => setArchivo(null)}><Icon name="trash" /> Quitar</button>
            </div>
          ) : (
            <label className={`drop ${arrastrando ? "over" : ""}`} htmlFor="i-file"
              onDragEnter={(e) => { e.preventDefault(); setArrastrando(true); }} onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)} onDrop={onDrop}>
              <Icon name="upload" />
              <b>Arrastra el PDF aquí o haz clic para buscarlo</b>
              <span className="muted small">Solo archivos .pdf · máximo 5 MB</span>
            </label>
          )}
          {errores.archivo && <div className="err" role="alert">{errores.archivo}</div>}

          <label className="check">
            <input type="checkbox" checked={acepta} onChange={(e) => { setAcepta(e.target.checked); setErrores((x) => ({ ...x, acepta: "" })); }} />
            <span>Declaro que la información es verdadera y autorizo su tratamiento para validar la incapacidad (Ley 1581 de 2012).</span>
          </label>
          {errores.acepta && <div className="err">{errores.acepta}</div>}
          <div className="row-actions">
            <SubmitButton busy={false}><Icon name="upload" /> Radicar solicitud</SubmitButton>
            <button className="btn" type="button" onClick={nueva}>Limpiar</button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <div className="card">
            <h3>Qué pasa al radicar</h3>
            <div className="process" style={{ marginTop: 12 }}>
              <ol>
                <li><span className="dot" /><span>Se guarda la solicitud y el PDF de forma segura.</span></li>
                <li><span className="dot" /><span>Se compara con la base de datos simulada de la EPS.</span></li>
                <li><span className="dot" /><span>Se envía un correo automático a Talento Humano.</span></li>
                <li><span className="dot" /><span>La empresa aprueba o rechaza y tú ves la respuesta.</span></li>
              </ol>
            </div>
          </div>
          <Notice tone="info" icon="shield"><b>Tu diagnóstico no se pide.</b> Para la validación solo se usan número, fechas, días, tipo y EPS. Así se protege tu información de salud, que la ley considera un dato sensible.</Notice>
        </div>
      </form>
    </>
  );
}
