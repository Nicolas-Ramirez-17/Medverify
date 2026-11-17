import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, INICIO_POR_ROL, RequireAuth, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { Loading } from "./components/ui";
import Login from "./pages/auth/Login";
import Registro from "./pages/auth/Registro";
import InicioEmpleado from "./pages/empleado/Inicio";
import Radicar from "./pages/empleado/Radicar";
import MisSolicitudes from "./pages/empleado/MisSolicitudes";
import PanelEmpresa from "./pages/empresa/Panel";
import Solicitudes from "./pages/empresa/Solicitudes";
import Correos from "./pages/empresa/Correos";
import SolicitudDetalle from "./pages/SolicitudDetalle";
import Perfil from "./pages/Perfil";
import ResumenAdmin from "./pages/admin/Resumen";
import Usuarios from "./pages/admin/Usuarios";
import Empresas from "./pages/admin/Empresas";
import Eps from "./pages/admin/Eps";
import Auditoria from "./pages/admin/Auditoria";
import Estado from "./pages/admin/Estado";

function Raiz() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Loading />;
  return <Navigate to={usuario ? INICIO_POR_ROL[usuario.rol] : "/login"} replace />;
}

function NoEncontrada() {
  return (
    <div className="notfound">
      <h1>Página no encontrada</h1>
      <p className="muted">La dirección no existe o cambió.</p>
      <Link className="btn primary" to="/">Ir al inicio</Link>
    </div>
  );
}

/**
 * Mapa de rutas. Cada rol solo entra a sus rutas; /solicitudes/:id y /perfil son compartidas.
 * La API también valida el rol en cada endpoint: proteger la ruta en el front es solo comodidad.
 */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Raiz />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="/empleado" element={<RequireAuth roles={["empleado"]}><InicioEmpleado /></RequireAuth>} />
              <Route path="/empleado/radicar" element={<RequireAuth roles={["empleado"]}><Radicar /></RequireAuth>} />
              <Route path="/empleado/solicitudes" element={<RequireAuth roles={["empleado"]}><MisSolicitudes /></RequireAuth>} />
              <Route path="/empresa" element={<RequireAuth roles={["empresa"]}><PanelEmpresa /></RequireAuth>} />
              <Route path="/empresa/solicitudes" element={<RequireAuth roles={["empresa", "admin"]}><Solicitudes /></RequireAuth>} />
              <Route path="/empresa/correos" element={<RequireAuth roles={["empresa", "admin"]}><Correos /></RequireAuth>} />
              <Route path="/solicitudes/:id" element={<SolicitudDetalle />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/admin" element={<RequireAuth roles={["admin"]}><ResumenAdmin /></RequireAuth>} />
              <Route path="/admin/usuarios" element={<RequireAuth roles={["admin"]}><Usuarios /></RequireAuth>} />
              <Route path="/admin/empresas" element={<RequireAuth roles={["admin"]}><Empresas /></RequireAuth>} />
              <Route path="/admin/eps" element={<RequireAuth roles={["admin"]}><Eps /></RequireAuth>} />
              <Route path="/admin/auditoria" element={<RequireAuth roles={["admin"]}><Auditoria /></RequireAuth>} />
              <Route path="/admin/estado" element={<RequireAuth roles={["admin"]}><Estado /></RequireAuth>} />
            </Route>
            <Route path="*" element={<NoEncontrada />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
