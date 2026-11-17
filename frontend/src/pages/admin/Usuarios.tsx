import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError, type Rol, type Usuario, type UsuarioIn } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { Icon } from "../../components/Icon";
import { useToast } from "../../components/Toast";
import { ErrorBox, Field, Loading, Modal, Notice, PageHead } from "../../components/ui";
import { useApi, useDebounced } from "../../hooks/useApi";
import { iniciales, ROL_LABEL } from "../../lib/format";
import { RE_CEDULA, RE_EMAIL } from "../../lib/reglas";

export default function Usuarios() {
  const { usuario: yo } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const qd = useDebounced(q);
  const r = useApi(() => api.listarUsuarios(qd || undefined), [qd]);
  const empresas = useApi(() => api.listarEmpresas(), []);
  const nuevo = params.get("nuevo") === "1";
  const [ocupado, setOcupado] = useState<number | null>(null);

  async function cambiar(u: Usuario, patch: { rol?: Rol; activo?: boolean }) {
    setOcupado(u.id);
    try {
      const x = await api.actualizarUsuario(u.id, patch);
      r.setData((prev) => (prev ?? []).map((y) => (y.id === x.id ? x : y)));
      toast(patch.activo !== undefined ? `${x.nombre} ${x.activo ? "activado" : "desactivado"}.` : `Rol de ${x.nombre}: ${ROL_LABEL[x.rol]}.`);
    } catch (e) { toast(e instanceof ApiError ? e.message : "No se pudo actualizar.", "bad"); }
    finally { setOcupado(null); }
  }
  const nombreEmpresa = (id: number | null) => (id === null ? "Plataforma" : empresas.data?.find((e) => e.id === id)?.razon_social ?? `Empresa ${id}`);

  return (
    <>
      <PageHead title="Usuarios y roles" subtitle="Crea usuarios, asigna su rol de acceso y activa o desactiva cuentas.">
        <button className="btn primary" onClick={() => setParams({ nuevo: "1" })}><Icon name="plus" /> Nuevo usuario</button>
      </PageHead>
      <div className="card flush">
        <div className="toolbar">
          <label className="sr" htmlFor="u-q">Buscar usuario</label>
          <input className="input search" id="u-q" placeholder="Buscar por nombre, correo o documento" value={q} onChange={(e) => setQ(e.target.value)} />
          {r.data && <span className="muted small">{r.data.length} usuarios</span>}
        </div>
        {r.loading && !r.data ? <Loading /> : r.error ? <ErrorBox error={r.error} onRetry={r.reload} /> : (
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Correo</th><th>Empresa</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {r.data!.map((u) => {
                  const soyYo = u.id === yo!.id;
                  return (
                    <tr key={u.id}>
                      <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><div className="avatar">{iniciales(u.nombre)}</div><div><b>{u.nombre}</b><div className="muted small">{u.cargo ?? "—"}</div></div></div></td>
                      <td className="small">{u.email}</td>
                      <td className="small">{nombreEmpresa(u.empresa_id)}</td>
                      <td>
                        <label className="sr" htmlFor={`rol-${u.id}`}>Rol de {u.nombre}</label>
                        <select className="input compact" id={`rol-${u.id}`} value={u.rol} disabled={soyYo || ocupado === u.id} onChange={(e) => cambiar(u, { rol: e.target.value as Rol })}>
                          {(Object.keys(ROL_LABEL) as Rol[]).map((x) => <option key={x} value={x}>{ROL_LABEL[x]}</option>)}
                        </select>
                      </td>
                      <td><span className={`pill ${u.activo ? "activo" : "inactivo"}`}>{u.activo ? "Activo" : "Inactivo"}</span></td>
                      <td><button className="btn sm" disabled={soyYo || ocupado === u.id} onClick={() => cambiar(u, { activo: !u.activo })}>{u.activo ? "Desactivar" : "Activar"}</button></td>
                    </tr>
                  );
                })}
                {!r.data!.length && <tr><td colSpan={6} className="empty">Sin resultados.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {nuevo && (
        <NuevoUsuario empresas={(empresas.data ?? []).map((e) => ({ id: e.id, nombre: e.razon_social }))}
          onClose={() => setParams({})} onDone={(u) => { r.reload(); setParams({}); toast(`Usuario ${u.nombre} creado.`); }} />
      )}
    </>
  );
}

function NuevoUsuario({ empresas, onClose, onDone }: { empresas: { id: number; nombre: string }[]; onClose: () => void; onDone: (u: Usuario) => void }) {
  const [f, setF] = useState<UsuarioIn>({ nombre: "", documento: "", email: "", rol: "empleado", empresa_id: empresas[0]?.id ?? 1, cargo: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [general, setGeneral] = useState("");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof UsuarioIn>(k: K, v: UsuarioIn[K]) => setF((x) => ({ ...x, [k]: v }));

  async function crear() {
    const fe: Record<string, string> = {};
    if (f.nombre.trim().length < 5) fe.nombre = "Escribe el nombre completo.";
    if (!RE_CEDULA.test(f.documento)) fe.documento = "Entre 6 y 10 dígitos, sin puntos.";
    if (!RE_EMAIL.test(f.email)) fe.email = "Escribe un correo válido.";
    setErrores(fe);
    if (Object.keys(fe).length) return;
    setBusy(true); setGeneral("");
    try { onDone(await api.crearUsuario({ ...f, nombre: f.nombre.trim(), email: f.email.trim(), empresa_id: f.rol === "admin" ? null : f.empresa_id, cargo: f.cargo?.trim() || null })); }
    catch (e) { if (e instanceof ApiError) { setErrores(e.fieldErrors); setGeneral(e.message); } setBusy(false); }
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose} footer={<><button className="btn" onClick={onClose}>Cancelar</button><button className="btn primary" onClick={crear} disabled={busy}>{busy && <span className="spinner" />}Crear usuario</button></>}>
      {general && <Notice tone="bad">{general}</Notice>}
      <Field id="n-nombre" label="Nombre completo" error={errores.nombre}><input className={`input ${errores.nombre ? "invalid" : ""}`} id="n-nombre" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} /></Field>
      <div className="grid2">
        <Field id="n-doc" label="Documento" error={errores.documento}><input className={`input mono ${errores.documento ? "invalid" : ""}`} id="n-doc" inputMode="numeric" value={f.documento} onChange={(e) => set("documento", e.target.value)} /></Field>
        <Field id="n-rol" label="Rol">
          <select className="input" id="n-rol" value={f.rol} onChange={(e) => set("rol", e.target.value as Rol)}>
            {(Object.keys(ROL_LABEL) as Rol[]).map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </select>
        </Field>
      </div>
      <Field id="n-email" label="Correo" error={errores.email}><input className={`input ${errores.email ? "invalid" : ""}`} id="n-email" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></Field>
      <div className="grid2">
        <Field id="n-emp" label="Empresa">
          <select className="input" id="n-emp" value={f.empresa_id ?? ""} disabled={f.rol === "admin"} onChange={(e) => set("empresa_id", Number(e.target.value))}>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </Field>
        <Field id="n-cargo" label="Cargo (opcional)"><input className="input" id="n-cargo" value={f.cargo ?? ""} onChange={(e) => set("cargo", e.target.value)} /></Field>
      </div>
      <p className="muted small">El backend envía al usuario un enlace para definir su contraseña (ver docs/HANDOFF.md). Nadie más la conoce.</p>
    </Modal>
  );
}
