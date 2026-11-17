// El JWT se guarda en sessionStorage: se borra al cerrar la pestaña.
// (Alternativa a discutir con backend: cookie httpOnly + SameSite=Strict, que protege mejor contra XSS.)
const KEY = "medverify.token";

export function getToken(): string | null {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
export function setToken(token: string): void {
  try { sessionStorage.setItem(KEY, token); } catch { /* modo privado */ }
}
export function clearToken(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* modo privado */ }
}
