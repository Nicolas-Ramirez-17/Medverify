import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Ejecuta una llamada a la API y expone { data, error, loading, reload }.
 * Se vuelve a ejecutar cuando cambian las dependencias. Ignora respuestas de llamadas viejas.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(() => {
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    run()
      .then((d) => { if (n === seq.current) setData(d); })
      .catch((e) => { if (n === seq.current) setError(e); })
      .finally(() => { if (n === seq.current) setLoading(false); });
  }, [run]);

  useEffect(() => { reload(); }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Retrasa un valor (para búsquedas mientras se escribe). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
