/** Piezas pequeñas de interfaz reutilizadas en todas las páginas. */
import { useEffect, useRef, type ReactNode } from "react";
import type { EstadoSolicitud, ResultadoValidacion } from "../api/types";
import { ESTADO_LABEL, VALIDACION_LABEL } from "../lib/format";
import { Icon, type IconName } from "./Icon";

export function EstadoPill({ estado }: { estado: EstadoSolicitud }) {
  return <span className={`pill ${estado}`}>{ESTADO_LABEL[estado]}</span>;
}
export function ValidacionPill({ resultado }: { resultado: ResultadoValidacion }) {
  return <span className={`pill ${resultado}`}>{VALIDACION_LABEL[resultado]}</span>;
}

export function Kpi({ label, value, tone, children }: { label: string; value: ReactNode; tone?: "warn" | "ok" | "bad" | "info" | "acc"; children?: ReactNode }) {
  return (
    <div className={`kpi ${tone ?? ""}`}>
      <span className="l">{label}</span>
      <span className="v">{value}</span>
      {children}
    </div>
  );
}

export function Notice({ tone, icon, children }: { tone: "ok" | "warn" | "bad" | "info"; icon?: IconName; children: ReactNode }) {
  const def: Record<string, IconName> = { ok: "check", warn: "info", bad: "alert", info: "info" };
  return (
    <div className={`notice ${tone}`} role={tone === "bad" ? "alert" : undefined}>
      <Icon name={icon ?? def[tone]} />
      <span>{children}</span>
    </div>
  );
}

export function Loading({ text = "Cargando…" }: { text?: string }) {
  return <div className="loading" role="status"><span className="spinner" />{text}</div>;
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : "Ocurrió un error inesperado.";
  return (
    <div className="card">
      <Notice tone="bad">{msg}</Notice>
      {onRetry && <button className="btn sm" style={{ marginTop: 12 }} onClick={onRetry}>Reintentar</button>}
    </div>
  );
}

export function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
      {error && <div className="err" id={`${id}-err`}>{error}</div>}
    </div>
  );
}

export function PageHead({ title, subtitle, children }: { title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function SubmitButton({ busy, children, className = "btn primary", ...rest }: { busy: boolean; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={className} type="submit" disabled={busy || rest.disabled} aria-busy={busy} {...rest}>
      {busy && <span className="spinner" />}
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onClose);
  cerrar.current = onClose;
  // Solo al abrir: enfoca el primer campo, escucha Escape y al cerrar devuelve el foco a donde estaba.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>("input:not([readonly]),select,textarea,button:not([aria-label='Cerrar'])");
    first?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
  }, []);
  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <header>
          <h2 id="modal-title">{title}</h2>
          <button className="btn ghost sm" onClick={onClose} aria-label="Cerrar"><Icon name="x" /></button>
        </header>
        <div className="mbody">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Pager({ pagina, tamano, total, onChange }: { pagina: number; tamano: number; total: number; onChange: (p: number) => void }) {
  const paginas = Math.max(1, Math.ceil(total / tamano));
  if (paginas <= 1) return null;
  return (
    <div className="pager">
      <span className="muted small">Página {pagina} de {paginas}</span>
      <button className="btn sm" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)} aria-label="Página anterior"><Icon name="back" /></button>
      <button className="btn sm" disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)} aria-label="Página siguiente"><Icon name="next" /></button>
    </div>
  );
}
