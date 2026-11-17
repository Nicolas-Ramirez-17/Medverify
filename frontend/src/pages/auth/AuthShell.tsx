import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { ProtoBanner } from "../../components/Layout";

export default function AuthShell({ tab, children }: { tab: "login" | "registro"; children: ReactNode }) {
  return (
    <>
      <ProtoBanner />
      <div className="auth">
        <section className="auth-hero">
          <div className="brand">
            <div className="logo"><Icon name="logo" width={20} /></div>
            <div><b style={{ color: "#fff" }}>Medverify</b><small>Validación de incapacidades médicas</small></div>
          </div>
          <h1>Radica tu incapacidad en PDF y <em>sigue su estado</em> sin papeles.</h1>
          <p className="lead">La plataforma compara cada certificado con los registros de la EPS simulada, avisa por correo a Talento Humano y deja trazabilidad de cada decisión.</p>
          <div className="flow">
            <ol>
              <li><span className="n">01</span><div><b>El empleado radica</b><span>Datos del certificado + PDF (máximo 5 MB).</span></div></li>
              <li><span className="n">02</span><div><b>El sistema valida</b><span>Compara documento, fechas, días, tipo y EPS con la base simulada.</span></div></li>
              <li><span className="n">03</span><div><b>RR. HH. recibe el correo</b><span>Notificación automática de cada nueva incapacidad.</span></div></li>
              <li><span className="n">04</span><div><b>La empresa decide</b><span>Aprueba o rechaza con observaciones; el empleado ve la respuesta.</span></div></li>
            </ol>
          </div>
          <div className="hero-stamp" aria-hidden="true">APROBADA</div>
        </section>
        <section className="auth-panel">
          <div className="auth-card">
            <div className="tabs" role="tablist">
              <Link role="tab" aria-selected={tab === "login"} to="/login" className="tabbtn">Iniciar sesión</Link>
              <Link role="tab" aria-selected={tab === "registro"} to="/registro" className="tabbtn">Crear cuenta</Link>
            </div>
            {children}
          </div>
        </section>
      </div>
    </>
  );
}
