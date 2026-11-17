// לקוח ה-API: כל קריאה לשרת עוברת דרך הקובץ הזה. כך יש מקום אחד שמטפל בטוקן,
// בשגיאות ובמצב שבו ההתחברות פגה (401).
import { API_URL } from "../config.js"; // כתובת השרת
import { translateMessage } from "./messages.js"; // תרגום הודעות השרת לעברית

const TOKEN_KEY = "ff_token"; // המפתח שתחתיו נשמר הטוקן ב-localStorage
const EXPIRES_KEY = "ff_expires_at"; // המפתח שתחתיו נשמר מתי הטוקן פג (מילישניות)

export function getToken() {
  return localStorage.getItem(TOKEN_KEY); // localStorage = אחסון בדפדפן ששורד רענון וסגירת לשונית
}

export function hasValidToken() {
  const token = getToken();
  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY)); // ממירים את הטקסט למספר (null → 0)
  return Boolean(token) && expiresAt > Date.now(); // יש טוקן וגם הוא עוד לא פג
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY); // מחיקת הטוקן
  localStorage.removeItem(EXPIRES_KEY); // ומועד התפוגה
}

// הפונקציה המרכזית: שולחת בקשה לשרת ומחזירה את גוף התשובה, או זורקת Error עם הודעה בעברית
export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {}; // כותרות הבקשה
  if (body !== undefined) headers["Content-Type"] = "application/json"; // אם יש גוף – הוא JSON
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`; // אם מחוברים – מצרפים את הטוקן

  let response;
  try {
    response = await fetch(API_URL + path, { // fetch = שליחת בקשת HTTP מהדפדפן
      method, // GET / POST / PATCH / DELETE
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined, // אובייקט JS → טקסט JSON
    });
  } catch {
    // fetch נכשל לגמרי (אין רשת / השרת כבוי) – אין בכלל תשובה
    const error = new Error("השרת לא זמין כרגע. נסו שוב בעוד רגע.");
    error.status = 0; // סטטוס 0 מסמן "אין חיבור", כדי שהקוד שקורא יוכל לזהות את המקרה הזה
    throw error;
  }

  if (response.status === 204) return null; // 204 = הצלחה בלי גוף (למשל מחיקה)

  let data = null;
  try {
    data = await response.json(); // מנסים לקרוא את הגוף כ-JSON
  } catch {
    // גוף שאינו JSON – מטפלים בו למטה לפי קוד הסטטוס
  }

  if (!response.ok) { // ok = סטטוס בטווח 200–299
    // 401 = הטוקן לא תקף. בדף ההתחברות 401 פירושו סיסמה שגויה, ולכן לא מנתקים שם
    if (response.status === 401 && path !== "/api/auth/login") {
      clearToken(); // מוחקים את הטוקן הישן
      window.location.assign("/login?expired=1"); // מעבר לדף ההתחברות עם הודעה "פג תוקף"
    }
    const error = new Error(translateMessage(data?.message)); // ההודעה מהשרת, מתורגמת לעברית
    error.status = response.status; // שומרים את הקוד, כדי שהדף יוכל להגיב לפי המקרה (409, 422...)
    throw error;
  }
  return data; // הצלחה – מחזירים את הנתונים
}

// ── הזדהות ──
export function register({ email, password, display_name }) { // פירוק האובייקט – לוקחים רק את השדות האלה
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: { email, password, display_name },
  });
}

export async function login({ email, password }) {
  const data = await apiFetch("/api/auth/login", { method: "POST", body: { email, password } });
  localStorage.setItem(TOKEN_KEY, data.access_token); // שומרים את הטוקן שהתקבל
  // expires_in בשניות; ממירים למילישניות ומוסיפים לזמן הנוכחי = מתי הטוקן יפוג
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + data.expires_in * 1000));
  return data;
}

export const logout = () => apiFetch("/api/auth/logout", { method: "POST" }); // השרת מבטל את הטוקן

// ── פרופיל ──
export const getMe = () => apiFetch("/api/users/me"); // פרטי המשתמש המחובר
export const updateMe = (fields) => apiFetch("/api/users/me", { method: "PATCH", body: fields }); // שינוי שם
export const changePassword = (fields) =>
  apiFetch("/api/users/me/password", { method: "POST", body: fields }); // החלפת סיסמה
export const deleteMe = () => apiFetch("/api/users/me", { method: "DELETE" }); // מחיקת חשבון

// ── תוכן ──
export const listContent = () => apiFetch("/api/content"); // רשימת הספרייה
// encodeURIComponent מקודד תווים מיוחדים במזהה, כך שמזהה זדוני לא ישנה את מבנה הכתובת
export const getContent = (id) => apiFetch(`/api/content/${encodeURIComponent(id)}`);
export const createContent = (fields) => apiFetch("/api/content", { method: "POST", body: fields });
export const deleteContent = (id) =>
  apiFetch(`/api/content/${encodeURIComponent(id)}`, { method: "DELETE" });

// ── סשנים ──
export const startSession = (contentId) =>
  apiFetch("/api/sessions", { method: "POST", body: { content_id: contentId } }); // התחלת סשן
export const postReading = (id, reading) =>
  apiFetch(`/api/sessions/${encodeURIComponent(id)}/readings`, { method: "POST", body: reading }); // שליחת מדידה
export const endSession = (id) =>
  apiFetch(`/api/sessions/${encodeURIComponent(id)}/end`, { method: "POST" }); // סיום סשן
// לדף שעומד להיסגר: keepalive מאפשר לבקשה להסתיים גם אחרי שהדף כבר נעלם.
// (זה המקום היחיד שקורא ל-fetch ישירות, כי apiFetch עלול לנסות לנווט לדף אחר)
export function endSessionOnLeave(id) {
  const token = getToken();
  fetch(`${API_URL}/api/sessions/${encodeURIComponent(id)}/end`, {
    method: "POST",
    keepalive: true, // הדפדפן ישלים את הבקשה גם כשהלשונית נסגרת
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => {}); // מתעלמים משגיאות – אין כבר דף להציג בו הודעה
}
export const listSessions = () => apiFetch("/api/sessions"); // רשימת הסשנים
export const getSession = (id) => apiFetch(`/api/sessions/${encodeURIComponent(id)}`); // סשן אחד עם מדידות
