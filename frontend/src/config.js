// כתובת השרת (API_URL). הערך מגיע מ-window.__APP_CONFIG__ שנכתב בקובץ public/config.js,
// וקונטיינר ה-nginx כותב את הקובץ הזה מחדש בכל הפעלה לפי משתנה הסביבה API_URL.
// כך אותה תמונה עובדת גם מקומית וגם בענן, בלי לבנות מחדש.
//
// מחרוזת ריקה היא ערך תקין: היא אומרת "אותו דומיין" (same-origin), וכך זה רץ בענן.
// לכן בודקים !== undefined ו-??, ולא בדיקת "אמת/שקר" (|| היה מתייחס ל-"" כאילו אין ערך).
const w = window.__APP_CONFIG__?.API_URL; // ?. = אם __APP_CONFIG__ לא קיים, מקבלים undefined במקום שגיאה

export const API_URL = (
  // אם הוגדר ערך (גם ריק) – משתמשים בו; אחרת משתנה של Vite בזמן בנייה; ואם גם הוא חסר – localhost:8000
  w !== undefined ? w : (import.meta.env.VITE_API_URL ?? "http://localhost:8000")
).replace(/\/$/, ""); // מסירים "/" בסוף, כדי ש-API_URL + "/api/..." לא ייצור "//"
