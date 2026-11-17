// גרף קווי של הציון לאורך התוכן (בדף פרטי הסשן), מצויר ב-SVG בלי ספרייה חיצונית.
import { formatPosition } from "./format.js"; // עיצוב המיקום (mm:ss או %)

const WIDTH = 640; // רוחב הגרף ביחידות SVG
const HEIGHT = 240; // גובה הגרף
const PAD = { top: 16, right: 16, bottom: 34, left: 40 }; // שוליים סביב אזור הציור (מקום לתוויות)
const LOW_LINE = 0.4; // גובה הקו המקווקו של "סף קשב נמוך"

// גרף הציון לפי המיקום בתוכן. מספרים רצים משמאל לימין גם בדף RTL,
// ולכן ה-svg קובע לעצמו כיוון (ב-CSS)
export default function ScoreChart({ readings, contentType }) { // readings = המדידות; contentType = youtube או text
  if (readings.length === 0) return null; // אין מדידות – אין גרף

  const plotWidth = WIDTH - PAD.left - PAD.right; // רוחב אזור הציור עצמו
  const plotHeight = HEIGHT - PAD.top - PAD.bottom; // גובה אזור הציור
  // המיקום הגדול ביותר קובע את קצה ציר ה-X. ... פורס את המערך לארגומנטים; 1 – כדי לא לחלק ב-0
  const maxPosition = Math.max(...readings.map((reading) => reading.position), 1);
  const x = (position) => PAD.left + (position / maxPosition) * plotWidth; // ממיר מיקום לקואורדינטת x
  const y = (score) => PAD.top + (1 - score) * plotHeight; // ממיר ציון ל-y (הפוך: ציון 1 למעלה)
  const line = readings
    .map((reading) => `${x(reading.position)},${y(reading.score)}`) // "x,y" לכל מדידה
    .join(" ");

  return (
    <svg
      className="score-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="גרף הציון לאורך התוכן"
    >
      {/* קווי רשת אופקיים ותוויות בגבהים 0, 0.5 ו-1 */}
      {[0, 0.5, 1].map((value) => (
        <g key={value}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--color-border)"
          />
          {/* התווית משמאל לקו; textAnchor="end" מיישר את סוף הטקסט לנקודה */}
          <text x={PAD.left - 8} y={y(value) + 4} textAnchor="end" fontSize="12" fill="currentColor">
            {value}
          </text>
        </g>
      ))}
      {/* הקו המקווקו של סף הקשב הנמוך (0.4); strokeDasharray = 6 קו, 4 רווח */}
      <line
        x1={PAD.left}
        x2={WIDTH - PAD.right}
        y1={y(LOW_LINE)}
        y2={y(LOW_LINE)}
        stroke="var(--color-danger)"
        strokeDasharray="6 4"
      />
      <text
        x={WIDTH - PAD.right}
        y={y(LOW_LINE) - 5}
        textAnchor="end"
        fontSize="12"
        fill="var(--color-danger)"
      >
        סף קשב נמוך
      </text>
      {/* קו הציונים עצמו */}
      <polyline points={line} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
      {/* עיגול קטן על כל מדידה */}
      {readings.map((reading, index) => (
        <circle
          key={index}
          cx={x(reading.position)}
          cy={y(reading.score)}
          r="3.5"
          fill="var(--color-primary)"
        />
      ))}
      {/* תווית תחילת ציר ה-X */}
      <text x={PAD.left} y={HEIGHT - 12} fontSize="12" fill="currentColor">
        {formatPosition(0, contentType)}
      </text>
      {/* תווית סוף ציר ה-X */}
      <text x={WIDTH - PAD.right} y={HEIGHT - 12} textAnchor="end" fontSize="12" fill="currentColor">
        {formatPosition(maxPosition, contentType)}
      </text>
      {/* כותרת הציר */}
      <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize="12" fill="currentColor">
        מיקום בתוכן
      </text>
    </svg>
  );
}
