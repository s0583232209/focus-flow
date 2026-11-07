import { formatPosition } from "./format.js";

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 16, right: 16, bottom: 34, left: 40 };
const LOW_LINE = 0.4;

// Line chart of the score over the position in the content. Numbers run left to right
// even on an RTL page, so the svg sets its own direction.
export default function ScoreChart({ readings, contentType }) {
  if (readings.length === 0) return null;

  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const maxPosition = Math.max(...readings.map((reading) => reading.position), 1);
  const x = (position) => PAD.left + (position / maxPosition) * plotWidth;
  const y = (score) => PAD.top + (1 - score) * plotHeight;
  const line = readings
    .map((reading) => `${x(reading.position)},${y(reading.score)}`)
    .join(" ");

  return (
    <svg
      className="score-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="גרף הציון לאורך התוכן"
    >
      {[0, 0.5, 1].map((value) => (
        <g key={value}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(value)}
            y2={y(value)}
            stroke="var(--color-border)"
          />
          <text x={PAD.left - 8} y={y(value) + 4} textAnchor="end" fontSize="12" fill="currentColor">
            {value}
          </text>
        </g>
      ))}
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
      <polyline points={line} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
      {readings.map((reading, index) => (
        <circle
          key={index}
          cx={x(reading.position)}
          cy={y(reading.score)}
          r="3.5"
          fill="var(--color-primary)"
        />
      ))}
      <text x={PAD.left} y={HEIGHT - 12} fontSize="12" fill="currentColor">
        {formatPosition(0, contentType)}
      </text>
      <text x={WIDTH - PAD.right} y={HEIGHT - 12} textAnchor="end" fontSize="12" fill="currentColor">
        {formatPosition(maxPosition, contentType)}
      </text>
      <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize="12" fill="currentColor">
        מיקום בתוכן
      </text>
    </svg>
  );
}
