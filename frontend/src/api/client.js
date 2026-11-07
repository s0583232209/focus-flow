import { API_URL } from "../config.js";
import { translateMessage } from "./messages.js";

const TOKEN_KEY = "ff_token";
const EXPIRES_KEY = "ff_expires_at";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function hasValidToken() {
  const token = getToken();
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY));
  return Boolean(token) && expiresAt > Date.now();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error("השרת לא זמין כרגע. נסו שוב בעוד רגע.");
    error.status = 0;
    throw error;
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // A body that is not JSON is handled below by the status.
  }

  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login") {
      clearToken();
      window.location.assign("/login?expired=1");
    }
    const error = new Error(translateMessage(data?.message));
    error.status = response.status;
    throw error;
  }
  return data;
}

// Auth
export function register({ email, password, display_name }) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: { email, password, display_name },
  });
}

export async function login({ email, password }) {
  const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + data.expires_in * 1000));
  return data;
}

export const logout = () => apiFetch("/api/auth/logout", { method: "POST" });

// Profile
export const getMe = () => apiFetch("/api/users/me");
export const updateMe = (fields) => apiFetch("/api/users/me", { method: "PATCH", body: fields });
export const changePassword = (fields) =>
  apiFetch("/api/users/me/password", { method: "POST", body: fields });
export const deleteMe = () => apiFetch("/api/users/me", { method: "DELETE" });

// Content
export const listContent = () => apiFetch("/api/content");
export const getContent = (id) => apiFetch(`/api/content/${encodeURIComponent(id)}`);
export const createContent = (fields) => apiFetch("/api/content", { method: "POST", body: fields });
export const deleteContent = (id) =>
  apiFetch(`/api/content/${encodeURIComponent(id)}`, { method: "DELETE" });

// Sessions
export const startSession = (contentId) =>
  apiFetch("/api/sessions", { method: "POST", body: { content_id: contentId } });
export const postReading = (id, reading) =>
  apiFetch(`/api/sessions/${encodeURIComponent(id)}/readings`, { method: "POST", body: reading });
export const endSession = (id) =>
  apiFetch(`/api/sessions/${encodeURIComponent(id)}/end`, { method: "POST" });
export const listSessions = () => apiFetch("/api/sessions");
export const getSession = (id) => apiFetch(`/api/sessions/${encodeURIComponent(id)}`);
