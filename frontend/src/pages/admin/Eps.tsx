import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, type RegistroEps, type RegistroEpsIn, type TipoIncapacidad } from "../../api";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { ErrorBox, Field, Loading, Modal, Notice, PageHead } from "../../components/ui";
import { useApi, useDebounced } from "../../hooks/useApi";
import { diasEntre, EPS_LIST, fFecha, miles, parseFecha, TIPO_LABEL } from "../../lib/format";
import { RE_CEDULA, RE_NUMERO_INCAPACIDAD } from "../../lib/reglas";

export default function Eps() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const qd = useDebounced(q);
  const r = useApi(() => api.listarRegistrosEps(qd || undefined), [qd]);
  const [editar, setEditar] = useState<RegistroEps | null>(null);
  const [borrar, setBorrar] = useState<RegistroEps | null>(null);
  const nuevo = params.get("nuevo") === "1";

  async function eliminar(x: RegistroEps) {
    try { await api.eliminarRegistroEps(x.numero); r.setData((prev) => (prev ?? []).filter((y) => y.numero !== x.numero)); toast(`Registro ${x.numero} eliminado.`); }
    catch (e) { toast(e instanceof ApiError ? e.message : "No se pudo eliminar.", "bad"); }
    setBorrar(null);
  }

  return (
    <>
      <PageHead title="Base de datos simulada de la EPS" subtitle="Registros ficticios contra los que se validan las incapacidades. No hay conexión con ninguna EPS real.">
        <button className="btn primary" onClick={() => setParams({ nuevo: "1" })}><Icon name="plus" /> Agregar registro</button>
      </PageHead>
      <Notice tone="info">Para probar la validación: un número que exista aquí y coincida en todo da <b>Coincide</b>; si cambian fechas, días, tipo o EPS da <b>Con inconsistencias</b>; si el número no existe da <b>No encontrada</b>.</Notice>
      <div className="card flush">
        <div className="toolbar">
          <label className="sr" htmlFor="eps-q">Buscar registro</label>
          <input className="input search" id="eps-q" placeholder="Buscar por número, cédula o nombre" value={q} onChange={(e) => setQ(e.target.value)} />
          {r.data && <span className="muted small">{r.data.length} registros</span>}
        </div>
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Número</th><th>Paciente</th><th>Tipo</th><th>Periodo</th><th className="num">Días</th><th>EPS</th><th>Acciones</th></tr></thead>
              <tbody>
                {r.data!.map((e) => (
                  <tr key={e.numero}>
                    <td className="mono">{e.numero}</td>
                    <td><b>{e.nombre_paciente}</b><div className="muted small">CC {miles(e.documento)}</div></td>
                    <td className="small">{TIPO_LABEL[e.tipo]}</td>
                    <td className="small">{fFecha(e.fecha_inicio)} – {fFecha(e.fecha_fin)}</td>
                    <td className="num">{e.dias}</td>
                    <td className="small">{e.eps}</td>
                    <td><div className="row-actions">
                      <button className="btn sm" onClick={() => setEditar(e)} aria-label={`Editar ${e.numero}`}><Icon name="edit" /></button>
                      <button className="btn sm" onClick={() => setBorrar(e)} aria-label={`Eliminar ${e.numero}`}><Icon name="trash" /></button>
                    </div></td>
                  </tr>
                ))}
                {!r.data!.length && <tr><td colSpan={7} className="empty">Sin resultados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(nuevo || editar) && (
        <RegistroModal inicial={editar} onClose={() => { setEditar(null); setParams({}); }}
          onDone={() => {
            r.reload(); // se vuelve a pedir la lista al servidor: es la fuente de verdad
            toast(editar ? "Registro actualizado." : "Registro agregado a la EPS simulada.");
            setEditar(null); setParams({});
          }} />
      )}
      {borrar && (
        <Modal title="Eliminar registro" onClose={() => setBorrar(null)} footer={<><button className="btn" onClick={() => setBorrar(null)}>Cancelar</button><button className="btn danger" onClick={() => eliminar(borrar)}>Eliminar</button></>}>
          <p>¿Eliminar el registro <b className="mono">{borrar.numero}</b> de {borrar.nombre_paciente}? Las solicitudes nuevas con ese número darán <b>No encontrada</b>. Las ya validadas conservan su resultado.</p>
        </Modal>
      )}
    </>
  );
}

function RegistroModal({ inicial, onClose, onDone }: { inicial: RegistroEps | null; onClose: () => void; onDone: (r: RegistroEps) => void }) {
  const [f, setF] = useState<RegistroEpsIn>(inicial
    ? { numero: inicial.numero, documento: inicial.documento, nombre_paciente: inicial.nombre_paciente, tipo: inicial.tipo, fecha_inicio: inicial.fecha_inicio, fecha_fin: inicial.fecha_fin, eps: inicial.eps, ips: inicial.ips }
    : { numero: "", documento: "", nombre_paciente: "", tipo: "enfermedad_general", fecha_inicio: "", fecha_fin: "", eps: EPS_LIST[0], ips: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof RegistroEpsIn>(k: K, v: RegistroEpsIn[K]) => setF((x) => ({ ...x, [k]: v }));

  async function guardar() {
    const fe: Record<string, string> = {};
    const numero = f.numero.trim().toUpperCase();
    if (!RE_NUMERO_INCAPACIDAD.test(numero)) fe.numero = "Formato EG-2026-000000.";
    if (!RE_CEDULA.test(f.documento)) fe.documento = "Entre 6 y 10 dígitos.";
    if (f.nombre_paciente.trim().length < 5) fe.nombre_paciente = "Escribe el nombre.";
    if (!f.fecha_inicio || !f.fecha_fin || parseFecha(f.fecha_fin) < parseFecha(f.fecha_inicio)) fe.fecha_fin = "Revisa las fechas de inicio y fin.";
    setErrores(fe);
    if (Object.keys(fe).length) return;
    setBusy(true); setGeneral("");
    const data = { ...f, numero, nombre_paciente: f.nombre_paciente.trim(), ips: f.ips.trim() || "IPS de prueba" };
    try { onDone(inicial ? await api.actualizarRegistroEps(inicial.numero, data) : await api.crearRegistroEps(data)); }
    catch (e) { if (e instanceof ApiError) { setErrores(e.fieldErrors); setGeneral(e.message); } setBusy(false); }
  }

  const inv = (k: string) => (errores[k] ? "invalid" : "");
  return (
    <Modal title={inicial ? "Editar registro EPS" : "Nuevo registro EPS"} onClose={onClose}
      footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={guardar} disabled={busy}>{busy && <span className="spinner" />}{inicial ? "Guardar cambios" : "Agregar registro"}</button></>}>
      {general && <Notice tone="bad">{general}</Notice>}
      <div className="grid2">
        <Field id="x-num" label="Número de incapacidad" error={errores.numero}><input className={`input mono ${inv("numero")}`} id="x-num" value={f.numero} readOnly={!!inicial} placeholder="EG-2026-000000" onChange={(e) => set("numero", e.target.value)} /></Field>
        <Field id="x-doc" label="Cédula" error={errores.documento}><input className={`input mono ${inv("documento")}`} id="x-doc" inputMode="numeric" value={f.documento} onChange={(e) => set("documento", e.target.value)} /></Field>
      </div>
      <Field id="x-nom" label="Nombre del paciente" error={errores.nombre_paciente}><input className={`input ${inv("nombre_paciente")}`} id="x-nom" value={f.nombre_paciente} onChange={(e) => set("nombre_paciente", e.target.value)} /></Field>
      <div className="grid2">
        <Field id="x-tipo" label="Tipo"><select className="input" id="x-tipo" value={f.tipo} onChange={(e) => set("tipo", e.target.value as TipoIncapacidad)}>{Object.entries(TIPO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field id="x-eps" label="EPS"><select className="input" id="x-eps" value={f.eps} onChange={(e) => set("eps", e.target.value)}>{EPS_LIST.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field id="x-ini" label="Inicio"><input className="input" type="date" id="x-ini" value={f.fecha_inicio} onChange={(e) => set("fecha_inicio", e.target.value)} /></Field>
        <Field id="x-fin" label="Fin" error={errores.fecha_fin} hint={f.fecha_inicio && f.fecha_fin ? `${diasEntre(f.fecha_inicio, f.fecha_fin)} días` : undefined}>
          <input className={`input ${inv("fecha_fin")}`} type="date" id="x-fin" value={f.fecha_fin} onChange={(e) => set("fecha_fin", e.target.value)} />
        </Field>
      </div>
      <Field id="x-ips" label="IPS"><input className="input" id="x-ips" value={f.ips} onChange={(e) => set("ips", e.target.value)} /></Field>
    </Modal>
  );
}
