import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../../api";
import { INICIO_POR_ROL, useAuth } from "../../auth/AuthContext";
import { Chips, Field, Notice, SubmitButton } from "../../components/ui";
import { useApi } from "../../hooks/useApi";
import { fuerzaPassword, passwordValida, RE_CEDULA, RE_EMAIL, RE_NIT } from "../../lib/reglas";
import AuthShell from "./AuthShell";

type Tipo = "empleado" | "empresa";
const COLORES = ["var(--bad)", "var(--bad)", "var(--warn)", "var(--ok)", "var(--ok)"];
const TEXTO = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte"];

export default function Registro() {
  const { usuario, registrarEmpleado, registrarEmpresa } = useAuth();
  const nav = useNavigate();
  const empresas = useApi(() => api.empresasPublicas(), []);
  const [tipo, setTipo] = useState<Tipo>("empleado");
  const [f, setF] = useState({ nombre: "", documento: "", empresa_id: "", ciudad: "Bogotá D.C.", email: "", password: "", acepta: false });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });
  const fuerza = fuerzaPassword(f.password);
  const empresaId = f.empresa_id || String(empresas.data?.[0]?.id ?? "");

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setGeneral("");
    const fe: Record<string, string> = {};
    const emp = tipo === "empleado";
    if (f.nombre.trim().length < (emp ? 5 : 4)) fe.nombre = emp ? "Escribe tu nombre completo." : "Escribe la razón social.";
    if (emp && !RE_CEDULA.test(f.documento)) fe.documento = "La cédula debe tener entre 6 y 10 dígitos, sin puntos.";
    if (!emp && !RE_NIT.test(f.documento.replace(/\./g, ""))) fe.documento = "El NIT debe tener 9 dígitos y el dígito de verificación.";
    if (!RE_EMAIL.test(f.email.trim())) fe.email = "Escribe un correo válido.";
    if (!passwordValida(f.password)) fe.password = "Usa al menos 8 caracteres, una mayúscula y un número.";
    if (!f.acepta) fe.acepta = "Debes autorizar el tratamiento de datos para crear la cuenta.";
    if (emp && !empresaId) fe.empresa_id = "Elige tu empresa.";
    setErrores(fe);
    if (Object.keys(fe).length) return;
    setBusy(true);
    try {
      const u = emp
        ? await registrarEmpleado({ nombre: f.nombre.trim(), documento: f.documento, email: f.email.trim(), password: f.password, empresa_id: Number(empresaId), acepta_tratamiento_datos: true })
        : await registrarEmpresa({ razon_social: f.nombre.trim(), nit: f.documento.trim(), ciudad: f.ciudad.trim(), email: f.email.trim(), password: f.password, acepta_tratamiento_datos: true });
      nav(INICIO_POR_ROL[u.rol], { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        // Mapear nombres de campos del backend a los del formulario
        const m = { ...err.fieldErrors };
        if (m.razon_social) m.nombre = m.razon_social;
        if (m.nit) m.documento = m.nit;
        setErrores(m);
        setGeneral(err.message);
      } else setGeneral("No se pudo crear la cuenta.");
    } finally { setBusy(false); }
  }

  const emp = tipo === "empleado";
  const inv = (k: string) => `input ${errores[k] ? "invalid" : ""}`;
  return (
    <AuthShell tab="registro">
      <div><h2>Crea tu cuenta</h2><p className="muted small" style={{ marginTop: 4 }}>Elige si te registras como empleado o como empresa.</p></div>
      <Chips label="Tipo de cuenta" value={tipo} onChange={(t) => { setTipo(t); setErrores({}); }} options={[{ value: "empleado", label: "Soy empleado" }, { value: "empresa", label: "Soy empresa" }]} />
      <form style={{ display: "grid", gap: 12 }} onSubmit={onSubmit} noValidate>
        {general && <Notice tone="bad">{general}</Notice>}
        <Field id="r-nombre" label={emp ? "Nombre completo" : "Razón social"} error={errores.nombre}>
          <input className={inv("nombre")} id="r-nombre" value={f.nombre} onChange={set("nombre")} autoComplete={emp ? "name" : "organization"} />
        </Field>
        <div className="grid2">
          <Field id="r-doc" label={emp ? "Cédula" : "NIT"} error={errores.documento}>
            <input className={`${inv("documento")} mono`} id="r-doc" value={f.documento} onChange={set("documento")} inputMode={emp ? "numeric" : "text"} placeholder={emp ? "Sin puntos" : "900000000-0"} />
          </Field>
          {emp ? (
            <Field id="r-emp" label="Empresa" error={errores.empresa_id}>
              <select className="input" id="r-emp" value={empresaId} onChange={(e) => { set("empresa_id")(e); setErrores((x) => ({ ...x, empresa_id: "" })); }} disabled={empresas.loading}>
                {(empresas.data ?? []).map((e) => <option key={e.id} value={e.id}>{e.razon_social}</option>)}
              </select>
            </Field>
          ) : (
            <Field id="r-ciudad" label="Ciudad"><input className="input" id="r-ciudad" value={f.ciudad} onChange={set("ciudad")} /></Field>
          )}
        </div>
        <Field id="r-email" label={emp ? "Correo corporativo" : "Correo de Talento Humano"} hint={emp ? undefined : "A este correo llegarán los avisos de nuevas incapacidades."} error={errores.email}>
          <input className={inv("email")} id="r-email" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
        </Field>
        <Field id="r-pass" label="Contraseña" error={errores.password}
          hint={f.password ? `Seguridad: ${TEXTO[fuerza]}` : "Mínimo 8 caracteres, una mayúscula y un número."}>
          <input className={inv("password")} id="r-pass" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" />
          <div className="strength" aria-hidden="true"><i style={{ width: `${(fuerza / 4) * 100}%`, background: COLORES[fuerza] }} /></div>
        </Field>
        <label className="check">
          <input type="checkbox" checked={f.acepta} onChange={set("acepta")} />
          <span>Autorizo el tratamiento de mis datos personales según la <b>Ley 1581 de 2012</b> y la política de privacidad de la plataforma.</span>
        </label>
        {errores.acepta && <div className="err">{errores.acepta}</div>}
        <SubmitButton busy={busy} disabled={tipo === "empleado" && empresas.loading}>Crear cuenta</SubmitButton>
      </form>
    </AuthShell>
  );
}
