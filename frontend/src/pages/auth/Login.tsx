import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, USE_MOCK } from "../../api";
import { INICIO_POR_ROL, useAuth } from "../../auth/AuthContext";
import { Icon, type IconName } from "../../components/Icon";
import { Field, Notice, SubmitButton } from "../../components/ui";
import { RE_EMAIL } from "../../lib/reglas";
import AuthShell from "./AuthShell";

// Usuarios de prueba del modo simulado (contraseña común: Demo2026*). El backend debe sembrar los mismos (docs/seed.sql).
const DEMO: { email: string; rol: string; quien: string; icon: IconName }[] = [
  { email: "laura.gomez@horizonte.test", rol: "Empleado", quien: "Laura Gómez Pardo · Residente de obra", icon: "user" },
  { email: "talentohumano@horizonte.test", rol: "Empresa (RR. HH.)", quien: "María José Aristizábal · Talento Humano", icon: "building" },
  { email: "admin@medverify.test", rol: "Administrador", quien: "Julián Vaca · Consola de la plataforma", icon: "shield" },
];
export const DEMO_PASSWORD = "Demo2026*";

export default function Login() {
  const { usuario, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { desde?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);

  if (usuario) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />;

  async function entrar(e: string, p: string) {
    setBusy(true); setGeneral("");
    try {
      const u = await login(e, p);
      const desde = loc.state?.desde;
      nav(desde && desde !== "/login" ? desde : INICIO_POR_ROL[u.rol], { replace: true });
    } catch (err) {
      setGeneral(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally { setBusy(false); }
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const fe: Record<string, string> = {};
    if (!RE_EMAIL.test(email.trim())) fe.email = "Escribe un correo válido.";
    if (password.length < 8) fe.password = "La contraseña tiene mínimo 8 caracteres.";
    setErrores(fe);
    if (!Object.keys(fe).length) entrar(email.trim(), password);
  }

  return (
    <AuthShell tab="login">
      <div><h2>Bienvenido de nuevo</h2><p className="muted small" style={{ marginTop: 4 }}>Ingresa con tu correo corporativo y contraseña.</p></div>
      <form style={{ display: "grid", gap: 14 }} onSubmit={onSubmit} noValidate>
        {general && <Notice tone="bad">{general}</Notice>}
        <Field id="l-email" label="Correo electrónico" error={errores.email}>
          <input className={`input ${errores.email ? "invalid" : ""}`} id="l-email" type="email" autoComplete="username" placeholder="nombre@empresa.com"
            value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errores.email} />
        </Field>
        <Field id="l-pass" label="Contraseña" error={errores.password}>
          <input className={`input ${errores.password ? "invalid" : ""}`} id="l-pass" type="password" autoComplete="current-password" placeholder="Mínimo 8 caracteres"
            value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errores.password} />
        </Field>
        <SubmitButton busy={busy}>Ingresar</SubmitButton>
      </form>
      {USE_MOCK && (
        <>
          <div className="divider">o entra con un usuario de prueba</div>
          <div className="demo-roles">
            {DEMO.map((d) => (
              <button key={d.email} className="demo-role" type="button" disabled={busy} onClick={() => entrar(d.email, DEMO_PASSWORD)}>
                <span className="ic"><Icon name={d.icon} width={20} /></span>
                <span><b>{d.rol}</b><span>{d.quien}</span></span>
                <Icon name="next" width={18} />
              </button>
            ))}
          </div>
          <p className="muted small">Modo simulado: contraseña de todos los usuarios de prueba <span className="mono">{DEMO_PASSWORD}</span>.</p>
        </>
      )}
    </AuthShell>
  );
}
