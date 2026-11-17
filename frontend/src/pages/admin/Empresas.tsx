import { useState } from "react";
import { api, ApiError, type Empresa, type EmpresaIn } from "../../api";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { ErrorBox, Field, Loading, Modal, Notice, PageHead } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { RE_EMAIL, RE_NIT } from "../../lib/reglas";

export default function Empresas() {
  const toast = useToast();
  const r = useApi(() => api.listarEmpresas(), []);
  const [nueva, setNueva] = useState(false);
  return (
    <>
      <PageHead title="Empresas" subtitle="Empresas que usan la plataforma y el correo donde reciben las notificaciones.">
        <button className="btn primary" onClick={() => setNueva(true)}><Icon name="plus" /> Nueva empresa</button>
      </PageHead>
      <div className="card flush">
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Empresa</th><th>NIT</th><th>Ciudad</th><th>Correo de notificaciones</th><th className="num">Empleados</th><th>Estado</th></tr></thead>
              <tbody>
                {r.data!.map((c) => (
                  <tr key={c.id}>
                    <td><b>{c.razon_social}</b></td><td className="mono">{c.nit}</td><td>{c.ciudad}</td><td className="small">{c.email_notificaciones}</td>
                    <td className="num">{c.total_empleados}</td><td><span className={`pill ${c.activa ? "activo" : "inactivo"}`}>{c.activa ? "Activa" : "Inactiva"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {nueva && <NuevaEmpresa onClose={() => setNueva(false)} onDone={(e) => { r.reload(); setNueva(false); toast(`Empresa ${e.razon_social} registrada.`); }} />}
    </>
  );
}

function NuevaEmpresa({ onClose, onDone }: { onClose: () => void; onDone: (e: Empresa) => void }) {
  const [f, setF] = useState<EmpresaIn>({ razon_social: "", nit: "", ciudad: "", email_notificaciones: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof EmpresaIn) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function crear() {
    const fe: Record<string, string> = {};
    if (f.razon_social.trim().length < 4) fe.razon_social = "Escribe la razón social.";
    if (!RE_NIT.test(f.nit.replace(/\./g, ""))) fe.nit = "9 dígitos y el dígito de verificación.";
    if (!RE_EMAIL.test(f.email_notificaciones)) fe.email_notificaciones = "Escribe un correo válido.";
    setErrores(fe);
    if (Object.keys(fe).length) return;
    setBusy(true);
    try { onDone(await api.crearEmpresa({ ...f, razon_social: f.razon_social.trim() })); }
    catch (e) { if (e instanceof ApiError) { setErrores(e.fieldErrors); setGeneral(e.message); } setBusy(false); }
  }

  return (
    <Modal title="Nueva empresa" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={crear} disabled={busy}>{busy && <span className="spinner" />}Registrar empresa</button></>}>
      {general && <Notice tone="bad">{general}</Notice>}
      <Field id="c-rs" label="Razón social" error={errores.razon_social}><input className={`input ${errores.razon_social ? "invalid" : ""}`} id="c-rs" value={f.razon_social} onChange={set("razon_social")} /></Field>
      <div className="grid2">
        <Field id="c-nit" label="NIT" error={errores.nit}><input className={`input mono ${errores.nit ? "invalid" : ""}`} id="c-nit" placeholder="900000000-0" value={f.nit} onChange={set("nit")} /></Field>
        <Field id="c-ciudad" label="Ciudad"><input className="input" id="c-ciudad" value={f.ciudad} onChange={set("ciudad")} /></Field>
      </div>
      <Field id="c-email" label="Correo de Talento Humano" hint="Aquí llegarán los avisos de cada nueva incapacidad." error={errores.email_notificaciones}>
        <input className={`input ${errores.email_notificaciones ? "invalid" : ""}`} id="c-email" type="email" value={f.email_notificaciones} onChange={set("email_notificaciones")} />
      </Field>
    </Modal>
  );
}
