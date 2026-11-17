// התראת "קשב נמוך": מופיעה כשהציון יורד מתחת ל-0.4. אחרי סגירה – שקט ל-30 שניות.
import { useEffect, useRef, useState } from "react"; // hooks של React

const LOW_SCORE = 0.4; // הסף שמתחתיו מציגים התראה
const QUIET_MS = 30_000; // זמן השקט אחרי סגירה: 30 שניות (במילישניות)

export default function LowFocusAlert({ score, onRewind }) { // score = הציון הנוכחי; onRewind = מה לעשות ב"חזרה 15 שניות"
  const [closedAt, setClosedAt] = useState(null); // מתי המשתמש סגר את ההתראה (null = לא סגר)
  const [, setTick] = useState(0); // state שמשמש רק כדי "להעיר" את הרכיב לרינדור מחדש (הערך עצמו לא נקרא)
  const timerRef = useRef(null); // useRef שומר ערך בין רינדורים בלי לגרום לרינדור – כאן את הטיימר

  useEffect(() => () => clearTimeout(timerRef.current), []); // בהסרת הרכיב: מבטלים טיימר פתוח

  const isLow = score !== null && score !== undefined && score < LOW_SCORE; // יש ציון והוא נמוך
  const quiet = closedAt !== null && Date.now() - closedAt < QUIET_MS; // עדיין בתוך 30 השניות שאחרי סגירה
  if (!isLow || quiet) return null; // אין מה להציג (null = הרכיב לא מצייר כלום)

  function close() {
    setClosedAt(Date.now()); // זוכרים מתי נסגר
    // מתזמנים רינדור מחדש כשזמן השקט נגמר – למקרה שהציון לא משתנה ולכן שום דבר אחר לא יגרום לרינדור
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTick((value) => value + 1), QUIET_MS);
  }

  return (
    // role="alert" – קורא מסך יקריא את ההודעה מיד כשהיא מופיעה
    <div className="notice notice-warning" role="alert">
      <p>נראה שהקשב ירד. רוצים לחזור 15 שניות אחורה או לקחת הפסקה קצרה?</p>
      <div className="button-row">
        <button type="button" className="btn" onClick={onRewind}>
          חזרה 15 שניות
        </button>
        <button type="button" className="btn" onClick={close}>
          סגירה
        </button>
      </div>
    </div>
  );
}
