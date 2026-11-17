import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type Tono = "ok" | "bad";
interface ToastItem { id: number; texto: string; tono: Tono }
const Ctx = createContext<(texto: string, tono?: Tono) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((texto: string, tono: Tono = "ok") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, texto, tono }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tono}`}><Icon name={t.tono === "ok" ? "check" : "alert"} /><span>{t.texto}</span></div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
