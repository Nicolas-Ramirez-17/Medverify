import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api, USE_MOCK, type Rol } from "../api";
import { reiniciarDatosSimulados } from "../api/mock/mockApi";
import { useAuth } from "../auth/AuthContext";
import { useApi } from "../hooks/useApi";
import { hace, iniciales, ROL_LABEL } from "../lib/format";
import { Icon, type IconName } from "./Icon";

interface Item { to: string; label: string; icon: IconName; badge?: number }

function navPara(rol: Rol, pendientes: number): [string, Item[]][] {
  if (rol === "empleado") return [
    ["Mi espacio", [{ to: "/empleado", label: "Inicio", icon: "home" }, { to: "/empleado/radicar", label: "Radicar incapacidad", icon: "plus" }, { to: "/empleado/solicitudes", label: "Mis solicitudes", icon: "list" }]],
    ["Cuenta", [{ to: "/perfil", label: "Mi perfil", icon: "user" }]],
  ];
  if (rol === "empresa") return [
    ["Gestión", [{ to: "/empresa", label: "Panel general", icon: "home" }, { to: "/empresa/solicitudes", label: "Solicitudes", icon: "inbox", badge: pendientes }, { to: "/empresa/correos", label: "Correos de notificación", icon: "mail" }]],
    ["Cuenta", [{ to: "/perfil", label: "Mi perfil", icon: "user" }]],
  ];
  return [
    ["Administración", [{ to: "/admin", label: "Resumen", icon: "home" }, { to: "/admin/usuarios", label: "Usuarios y roles", icon: "users" }, { to: "/admin/empresas", label: "Empresas", icon: "building" }, { to: "/admin/eps", label: "BD simulada de la EPS", icon: "db" }]],
    ["Supervisión", [{ to: "/admin/auditoria", label: "Historial y auditoría", icon: "audit" }, { to: "/empresa/solicitudes", label: "Todas las solicitudes", icon: "inbox" }, { to: "/empresa/correos", label: "Correos enviados", icon: "mail" }, { to: "/admin/estado", label: "Estado del sistema", icon: "pulse" }]],
    ["Cuenta", [{ to: "/perfil", label: "Mi perfil", icon: "user" }]],
  ];
}

const TITULOS: [RegExp, string][] = [
  [/^\/empleado$/, "Inicio"], [/^\/empleado\/radicar/, "Radicar incapacidad"], [/^\/empleado\/solicitudes/, "Mis solicitudes"],
  [/^\/empresa$/, "Panel general"], [/^\/empresa\/solicitudes/, "Solicitudes"], [/^\/empresa\/correos/, "Correos de notificación"],
  [/^\/solicitudes\//, "Detalle de la solicitud"], [/^\/perfil/, "Mi perfil"],
  [/^\/admin$/, "Resumen"], [/^\/admin\/usuarios/, "Usuarios y roles"], [/^\/admin\/empresas/, "Empresas"], [/^\/admin\/eps/, "BD simulada de la EPS"],
  [/^\/admin\/auditoria/, "Historial y auditoría"], [/^\/admin\/estado/, "Estado del sistema"],
];

function toggleTema() {
  const root = document.documentElement;
  const oscuro = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = oscuro ? "light" : "dark";
  try { localStorage.setItem("medverify.tema", root.dataset.theme); } catch { /* sin almacenamiento */ }
}

// Confirmación con el navegador solo para esta acción de desarrollo (no es parte del producto).
const confirmarReinicio = () => window.confirm("¿Volver a los datos de prueba iniciales? Se pierden los cambios hechos en esta pestaña.");

export function ProtoBanner() {
  return (
    <div className="proto" role="note">
      <b>PROTOTIPO ACADÉMICO</b>
      <span>Medverify · UMB – Gerencia de Proyectos de Software 2026 · Datos ficticios</span>
      <span className="mode-tag" title={USE_MOCK ? "VITE_USE_MOCK=true" : String(import.meta.env.VITE_API_URL)}>{USE_MOCK ? "API simulada" : "API real"}</span>
      {USE_MOCK && <button className="proto-reset" onClick={() => { if (confirmarReinicio()) reiniciarDatosSimulados(); }}>Reiniciar datos de prueba</button>}
    </div>
  );
}

export default function Layout() {
  const { usuario, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const [campana, setCampana] = useState(false);
  const campanaRef = useRef<HTMLDivElement>(null);
  const u = usuario!;

  // Se recargan contadores y notificaciones en cada cambio de ruta.
  const pend = useApi(() => (u.rol === "empresa" ? api.listarSolicitudes({ estado: "pendiente", tamano: 1 }).then((p) => p.total) : Promise.resolve(0)), [u.rol, loc.pathname]);
  const notifs = useApi(() => api.listarNotificaciones(), [loc.pathname]);
  const sinLeer = (notifs.data ?? []).filter((n) => !n.leida).length;

  useEffect(() => { setMenu(false); setCampana(false); }, [loc.pathname]);
  useEffect(() => {
    if (!campana) return;
    const onDoc = (e: MouseEvent) => { if (!campanaRef.current?.contains(e.target as Node)) setCampana(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCampana(false); };
    document.addEventListener("mousedown", onDoc); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [campana]);

  const abrirCampana = () => {
    const abrir = !campana;
    setCampana(abrir);
    if (abrir && sinLeer) api.marcarNotificacionesLeidas().catch(() => {});
  };

  const titulo = TITULOS.find(([re]) => re.test(loc.pathname))?.[1] ?? "";
  const crumb = u.rol === "empleado" ? "Portal del empleado" : u.rol === "empresa" ? "Talento Humano" : "Consola de administración";
  const enDetalle = loc.pathname.startsWith("/solicitudes/");

  return (
    <>
      <ProtoBanner />
      <div className={`app ${menu ? "nav-open" : ""}`}>
        <aside className="side" aria-label="Navegación">
          <div className="brand"><div className="logo"><Icon name="logo" width={20} /></div><div><b>Medverify</b><small>Incapacidades médicas</small></div></div>
          {navPara(u.rol, pend.data ?? 0).map(([grupo, items]) => (
            <div key={grupo}>
              <div className="nav-label">{grupo}</div>
              <nav className="nav">
                {items.map((it) => (
                  <Link key={it.to} to={it.to}
                    aria-current={(loc.pathname === it.to || (enDetalle && it.to.endsWith("solicitudes"))) ? "page" : undefined}>
                    <Icon name={it.icon} /><span>{it.label}</span>{it.badge ? <span className="count">{it.badge}</span> : null}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
          <div className="side-foot">
            <div className="me"><div className="avatar">{iniciales(u.nombre)}</div><div><b>{u.nombre}</b><span>{ROL_LABEL[u.rol]}</span></div></div>
            <button className="btn ghost sm" onClick={() => { logout(); nav("/login"); }}><Icon name="out" /> Cerrar sesión</button>
          </div>
        </aside>
        <div className="scrim" onClick={() => setMenu(false)} />
        <div className="main">
          <header className="top">
            <button className="btn ghost sm menu-btn" onClick={() => setMenu(true)} aria-label="Abrir menú"><Icon name="menu" /></button>
            <div><div className="crumb">{crumb}</div><h2 style={{ fontSize: "1.15rem" }}>{titulo}</h2></div>
            <div className="spacer" />
            <button className="btn ghost sm" onClick={toggleTema} aria-label="Cambiar tema claro u oscuro" title="Tema"><Icon name="sun" /></button>
            <div className="rel" ref={campanaRef}>
              <button className="btn ghost sm bell" onClick={abrirCampana} aria-label={`Notificaciones${sinLeer ? ` (${sinLeer} sin leer)` : ""}`} aria-expanded={campana}>
                <Icon name="bell" />{sinLeer > 0 && <span className="dotn" />}
              </button>
              {campana && (
                <div className="dropdown" role="dialog" aria-label="Notificaciones">
                  <div className="di"><b>Notificaciones</b></div>
                  {(notifs.data ?? []).length === 0 && <div className="di muted">No tienes notificaciones.</div>}
                  {(notifs.data ?? []).slice(0, 6).map((n) => n.solicitud_id ? (
                    <Link key={n.id} className={`di ${n.leida ? "" : "unread"}`} to={`/solicitudes/${n.solicitud_id}`}><span>{n.mensaje}</span><span className="muted small">{hace(n.creada_en)}</span></Link>
                  ) : (
                    <div key={n.id} className={`di ${n.leida ? "" : "unread"}`}><span>{n.mensaje}</span><span className="muted small">{hace(n.creada_en)}</span></div>
                  ))}
                </div>
              )}
            </div>
            <span className="pill role">{ROL_LABEL[u.rol]}</span>
          </header>
          <main className="content" id="contenido"><Outlet /></main>
          <footer className="foot">
            Medverify v0.9 · Frontend React + TypeScript · API FastAPI · PostgreSQL · Correo de pruebas Mailpit. Solo PDF, sin OCR ni conexión con EPS reales. Datos personales tratados según la Ley 1581 de 2012.
          </footer>
        </div>
      </div>
    </>
  );
}
