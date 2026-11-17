import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Tema elegido por el usuario (claro/oscuro); si no eligió, se sigue el del sistema operativo.
try {
  const t = localStorage.getItem("medverify.tema");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch { /* sin almacenamiento */ }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
