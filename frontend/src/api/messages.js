// השרת עונה באנגלית (זה API). הממשק בעברית, ולכן לכל הודעה מוכרת יש כאן תרגום.
// הודעה לא מוכרת מוצגת כמו שהגיעה.

// תרגום מדויק: הודעת השרת (מפתח) → הטקסט בעברית (ערך)
const EXACT = {
  "Email already registered": "האימייל הזה כבר רשום. אפשר להתחבר.",
  "Incorrect email or password": "אימייל או סיסמה שגויים",
  "Too many failed attempts. Try again in 15 minutes.":
    "יותר מדי ניסיונות כושלים. נסו שוב בעוד 15 דקות.",
  "Current password is incorrect": "הסיסמה הנוכחית שגויה",
  "Invalid YouTube link": "הקישור לא נראה כמו קישור תקין לסרטון YouTube",
  "Content not found": "הפריט לא נמצא",
  "Session not found": "הסשן לא נמצא",
  "Session already ended": "הסשן נסגר",
  "Not found": "לא נמצא",
  "Internal server error": "אירעה שגיאה בשרת. נסו שוב בעוד רגע.",
  "database unavailable": "השרת לא זמין כרגע. נסו שוב בעוד רגע.",
};

// שגיאות אימות מהשרת נראות כמו "email: value is not a valid email". לפי שם השדה בוחרים הודעה ברורה
const FIELD_NAMES = {
  email: "כתובת האימייל לא תקינה",
  password: "הסיסמה לא תקינה",
  display_name: "שם התצוגה לא תקין (עד 50 תווים)",
  title: "הכותרת לא תקינה (עד 200 תווים)",
  type: "סוג התוכן לא נתמך",
  source: "המקור לא תקין",
};

export function translateMessage(message) {
  if (!message) return "אירעה שגיאה. נסו שוב."; // אין הודעה בכלל – הודעה כללית
  if (EXACT[message]) return EXACT[message]; // יש תרגום מדויק
  if (message.startsWith("Text must be")) return "הטקסט צריך להיות באורך 20 עד 100,000 תווים"; // הודעה עם מספרים משתנים
  // שגיאות אימות בפורמט "שדה: סיבה" – לוקחים את מה שלפני הנקודתיים
  const field = message.split(":")[0];
  return FIELD_NAMES[field] ?? message; // אם השדה מוכר – ההודעה בעברית; אחרת ההודעה המקורית (הודעות הסיסמה כבר בעברית)
}
