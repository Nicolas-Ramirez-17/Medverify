import { useState, type FormEvent } from "react";
import { api, ApiError } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../components/Toast";
import { Field, Modal, Notice, PageHead, SubmitButton } from "../components/ui";
import { iniciales, miles, ROL_LABEL } from "../lib/format";
import { passwordValida } from "../lib/reglas";

export default function Perfil() {
  const { usuario, setUsuario } = useAuth();
  const toast = useToast();
  const u = usuario!;
  const [nombre, setNombre] = useState(u.nombre);
  const [cargo, setCargo] = useState(u.cargo ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pw, setPw] = useState(false);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 5) { setErr("Escribe tu nombre completo."); return; }
    setBusy(true); setErr("");
    try {
      setUsuario(await api.actualizarPerfil({ nombre: nombre.trim(), cargo: cargo.trim() || null }));
      toast("Perfil actualizado.");
    } catch (x) { setErr(x instanceof ApiError ? x.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Mi perfil" subtitle="Tus datos de acceso y de contacto." />
      <div className="cols">
        <form className="card" style={{ display: "grid", gap: 14 }} onSubmit={guardar} noValidate>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.1rem" }}>{iniciales(u.nombre)}</div>
            <div><h3>{u.nombre}</h3><span className="pill role">{ROL_LABEL[u.rol]}</span></div>
          </div>
          {err && <Notice tone="bad">{err}</Notice>}
          <div className="grid2">
            <Field id="p-nombre" label="Nombre"><input className="input" id="p-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
            <Field id="p-doc" label="Documento" hint="Solo el administrador puede corregirlo."><input className="input mono" id="p-doc" value={miles(u.documento)} readOnly /></Field>
            <Field id="p-email" label="Correo"><input className="input" id="p-email" value={u.email} readOnly /></Field>
            <Field id="p-cargo" label="Cargo"><input className="input" id="p-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} /></Field>
          </div>
          <div><SubmitButton busy={busy}>Guardar cambios</SubmitButton></div>
        </form>
        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <div className="card">
            <h3>Seguridad</h3>
            <p className="muted small" style={{ marginTop: 6 }}>Tu contraseña se guarda cifrada con hash y nunca es visible para nadie, ni siquiera para el administrador.</p>
            <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setPw(true)}>Cambiar contraseña</button>
          </div>
          <div className="card">
            <h3>Tus datos</h3>
            <p className="muted small" style={{ marginTop: 6 }}>La plataforma solo guarda los datos necesarios para validar tus incapacidades. Tu diagnóstico no se solicita ni se almacena (Ley 1581 de 2012).</p>
          </div>
        </div>
      </div>
      {pw && <CambiarPassword onClose={() => setPw(false)} />}
    </>
  );
}

function CambiarPassword({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function ok() {
    if (!passwordValida(nueva)) { setErrores({ password_nueva: "Mínimo 8 caracteres, una mayúscula y un número." }); return; }
    setBusy(true);
    try { await api.cambiarPassword(actual, nueva); toast("Contraseña actualizada."); onClose(); }
    catch (e) { setErrores(e instanceof ApiError ? { general: e.message, ...e.fieldErrors } : { general: "No se pudo cambiar." }); setBusy(false); }
  }

  return (
    <Modal title="Cambiar contraseña" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={ok} disabled={busy}>{busy && <span className="spinner" />}Actualizar</button></>}>
      {errores.general && !errores.password_actual && <Notice tone="bad">{errores.general}</Notice>}
      <Field id="pw1" label="Contraseña actual" error={errores.password_actual}><input className="input" type="password" id="pw1" value={actual} onChange={(e) => setActual(e.target.value)} autoComplete="current-password" /></Field>
      <Field id="pw2" label="Nueva contraseña" error={errores.password_nueva} hint="Mínimo 8 caracteres, una mayúscula y un número."><input className="input" type="password" id="pw2" value={nueva} onChange={(e) => setNueva(e.target.value)} autoComplete="new-password" /></Field>
    </Modal>
  );
}
