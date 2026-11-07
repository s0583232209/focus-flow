// An empty string is a valid value: it means same-origin, which is how the cloud runs.
// So the fallback uses !== undefined and ??, never a truthiness check.
const w = window.__APP_CONFIG__?.API_URL;

export const API_URL = (
  w !== undefined ? w : (import.meta.env.VITE_API_URL ?? "http://localhost:8000")
).replace(/\/$/, "");
