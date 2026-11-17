// פונקציות עיצוב לתצוגה: תאריכים, שעונים ומיקומים.

// תאריך ושעה בפורמט ישראלי קצר, למשל "10.11.2026, 14:03"
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" }); // מחרוזת ISO → Date → טקסט לפי אזור he-IL
}

// תאריך בלבד, למשל "10.11.2026"
export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("he-IL");
}

// שניות → mm:ss (למשל 75 → "01:15")
export function formatClock(totalSeconds) {
  const whole = Math.max(0, Math.round(totalSeconds)); // עיגול לשנייה שלמה, ולא פחות מ-0
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0"); // דקות, עם אפס מוביל ("01")
  const seconds = String(whole % 60).padStart(2, "0"); // השניות שנשארו (% = שארית החלוקה)
  return `${minutes}:${seconds}`;
}

// משך בין שני תאריכים בפורמט mm:ss
export function formatDuration(startIso, endIso) {
  return formatClock((new Date(endIso) - new Date(startIso)) / 1000); // חיסור תאריכים נותן מילישניות; /1000 = שניות
}

// מיקום של מדידה: בסרטון – שניות (mm:ss), בטקסט – אחוז גלילה
export function formatPosition(position, contentType) {
  return contentType === "text" ? `${position}%` : formatClock(position);
}
