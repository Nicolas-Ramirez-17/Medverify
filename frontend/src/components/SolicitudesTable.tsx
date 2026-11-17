import { useNavigate } from "react-router-dom";
import type { SolicitudResumen } from "../api/types";
import { fFecha, miles, TIPO_LABEL } from "../lib/format";
import { EstadoPill, ValidacionPill } from "./ui";

/** Tabla de solicitudes. Cada fila abre /solicitudes/:id (clic o Enter). */
export default function SolicitudesTable({ items, mostrarEmpleado = false, mostrarValidacion = false, vacio = "No hay solicitudes para mostrar." }:
  { items: SolicitudResumen[]; mostrarEmpleado?: boolean; mostrarValidacion?: boolean; vacio?: string }) {
  const nav = useNavigate();
  if (!items.length) return <div className="empty">{vacio}</div>;
  return (
    <div className="tbl-wrap">
      <table>
        <thead>
          <tr>
            <th>Radicado</th>{mostrarEmpleado && <th>Empleado</th>}<th>Tipo</th><th>Periodo</th><th className="num">Días</th>
            {mostrarValidacion && <th>Validación EPS</th>}<th>Estado</th><th>Radicada</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="click" tabIndex={0} onClick={() => nav(`/solicitudes/${s.id}`)}
              onKeyDown={(e) => { if (e.key === "Enter") nav(`/solicitudes/${s.id}`); }} aria-label={`Abrir solicitud ${s.radicado}`}>
              <td className="mono">{s.radicado}</td>
              {mostrarEmpleado && <td><b>{s.empleado.nombre}</b><div className="muted small">CC {miles(s.empleado.documento)}</div></td>}
              <td>{TIPO_LABEL[s.tipo]}</td>
              <td className="small">{fFecha(s.fecha_inicio)} – {fFecha(s.fecha_fin)}</td>
              <td className="num">{s.dias}</td>
              {mostrarValidacion && <td>{s.resultado_validacion && <ValidacionPill resultado={s.resultado_validacion} />}</td>}
              <td><EstadoPill estado={s.estado} /></td>
              <td className="small muted">{fFecha(s.creada_en)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
