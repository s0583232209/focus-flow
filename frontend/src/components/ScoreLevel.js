// הגדרה אחת של "מילת הציון" וצבעו, משותפת לדף הצפייה ולדפי ההיסטוריה.
// כך הספים (0.7 ו-0.4) מוגדרים במקום אחד בלבד.
export function scoreLevel(score) {
  if (score === null || score === undefined) { // אין ציון (סשן בלי מדידות)
    return { label: "אין מדידות", colorVar: "var(--color-muted)" }; // צבע אפור מקובץ ה-CSS
  }
  if (score >= 0.7) return { label: "קשוב", colorVar: "var(--color-success)" }; // 0.7 ומעלה – ירוק
  if (score >= 0.4) return { label: "קשב חלקי", colorVar: "var(--color-warning)" }; // 0.4 עד 0.7 – כתום
  return { label: "קשב נמוך", colorVar: "var(--color-danger)" }; // מתחת ל-0.4 – אדום
}
