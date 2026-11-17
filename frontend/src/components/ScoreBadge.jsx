// תצוגת ציון הקשב הנוכחי: מספר גדול, מילה, פס צבעוני וגרף קטן (sparkline) של הציונים האחרונים.
import { scoreLevel } from "./ScoreLevel.js"; // מילה וצבע לפי הציון

const SPARK_POINTS = 30; // כמה ציונים אחרונים מציגים בגרף הקטן
const SPARK_WIDTH = 200; // רוחב הגרף ביחידות SVG
const SPARK_HEIGHT = 40; // גובה הגרף

function Sparkline({ history }) { // history = מערך כל הציונים עד עכשיו
  const scores = history.slice(-SPARK_POINTS); // slice(-30) = 30 האחרונים
  if (scores.length < 2) return null; // צריך לפחות 2 נקודות כדי לצייר קו
  const step = SPARK_WIDTH / (scores.length - 1); // המרחק האופקי בין נקודה לנקודה
  const points = scores
    // לכל ציון: x לפי המיקום ברשימה, y הפוך (ב-SVG ה-0 למעלה), כך שציון 1 בראש הגרף
    .map((score, index) => `${index * step},${SPARK_HEIGHT - score * SPARK_HEIGHT}`)
    .join(" "); // "x1,y1 x2,y2 ..." – הפורמט ש-polyline מצפה לו
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} // מערכת הצירים של הציור; ה-CSS קובע את הגודל האמיתי
      role="img" // לקוראי מסך: זו תמונה
      aria-label="הציונים האחרונים" // והתיאור שלה
    >
      {/* polyline = קו שבור שעובר דרך כל הנקודות */}
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
    </svg>
  );
}

export default function ScoreBadge({ score, history = [] }) { // ברירת מחדל: היסטוריה ריקה
  const hasScore = score !== null && score !== undefined; // האם כבר התקבל ציון
  const level = scoreLevel(score); // מילה וצבע
  return (
    // aria-live="polite" – קורא מסך יקריא את השינוי כשהציון מתעדכן, בלי לקטוע דברים אחרים
    <section className="card score-badge" aria-live="polite">
      <h2>ציון קשב נוכחי</h2>
      {/* אופרטור משולש: אם יש ציון – החלק הראשון, אחרת – השני */}
      {hasScore ? (
        <>
          {/* toFixed(2) = שתי ספרות אחרי הנקודה; הצבע לפי הרמה */}
          <p className="score-value" style={{ color: level.colorVar }}>
            {score.toFixed(2)} <span className="score-word">{level.label}</span>
          </p>
          <div className="score-bar">
            {/* הפס הפנימי ברוחב של הציון באחוזים (0.65 → 65%) */}
            <div
              className="score-bar-fill"
              style={{ width: `${score * 100}%`, background: level.colorVar }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="score-value muted">—</p>
          <p className="muted">ממתין לציון ראשון</p>
        </>
      )}
      <p className="hint">0 = לא קשוב, 1 = קשוב מאוד · מתעדכן כל 2 שניות</p>
      <Sparkline history={history} />
    </section>
  );
}
