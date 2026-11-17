import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// VITE_BASE: ruta donde se publica la app. En local es "/"; en GitHub Pages es "/Medverify/"
// (lo define .github/workflows/deploy.yml). El backend (FastAPI) debe permitir CORS desde http://localhost:5173.
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: { port: 5173 },
});
