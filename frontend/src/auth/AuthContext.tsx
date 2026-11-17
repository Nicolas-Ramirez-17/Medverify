import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, type RegistroEmpleadoIn, type RegistroEmpresaIn, type Rol, type TokenResponse, type Usuario } from "../api";
import { clearToken, getToken, setToken } from "./token";
import { Loading } from "../components/ui";

interface AuthState {
  usuario: Usuario | null;
  cargando: boolean;
  login(email: string, password: string): Promise<Usuario>;
  registrarEmpleado(d: RegistroEmpleadoIn): Promise<Usuario>;
  registrarEmpresa(d: RegistroEmpresaIn): Promise<Usuario>;
  logout(): void;
  setUsuario(u: Usuario): void;
}
const Ctx = createContext<AuthState | null>(null);

export const INICIO_POR_ROL: Record<Rol, string> = { empleado: "/empleado", empresa: "/empresa", admin: "/admin" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app: si hay token, se pide GET /auth/me para recuperar la sesión.
  useEffect(() => {
    if (!getToken()) { setCargando(false); return; }
    api.me().then(setUsuario).catch(() => clearToken()).finally(() => setCargando(false));
  }, []);

  // http.ts lanza este evento cuando la API responde 401.
  useEffect(() => {
    const onExpired = () => setUsuario(null);
    window.addEventListener("medverify:sesion-expirada", onExpired);
    return () => window.removeEventListener("medverify:sesion-expirada", onExpired);
  }, []);

  const entrar = (t: TokenResponse) => { setToken(t.access_token); setUsuario(t.usuario); return t.usuario; };
  const login = useCallback(async (email: string, password: string) => entrar(await api.login(email, password)), []);
  const registrarEmpleado = useCallback(async (d: RegistroEmpleadoIn) => entrar(await api.registrarEmpleado(d)), []);
  const registrarEmpresa = useCallback(async (d: RegistroEmpresaIn) => entrar(await api.registrarEmpresa(d)), []);
  const logout = useCallback(() => { clearToken(); setUsuario(null); }, []);

  return <Ctx.Provider value={{ usuario, cargando, login, registrarEmpleado, registrarEmpresa, logout, setUsuario }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return c;
}

/** Protege rutas: sin sesión → /login; con rol no permitido → inicio de su rol. */
export function RequireAuth({ roles, children }: { roles?: Rol[]; children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const loc = useLocation();
  if (cargando) return <Loading text="Verificando sesión…" />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: loc.pathname }} />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={INICIO_POR_ROL[usuario.rol]} replace />;
  return <>{children}</>;
}
