import { scoreLevel } from "./ScoreLevel.js";

const SPARK_POINTS = 30;
const SPARK_WIDTH = 200;
const SPARK_HEIGHT = 40;

function Sparkline({ history }) {
  const scores = history.slice(-SPARK_POINTS);
  if (scores.length < 2) return null;
  const step = SPARK_WIDTH / (scores.length - 1);
  const points = scores
    .map((score, index) => `${index * step},${SPARK_HEIGHT - score * SPARK_HEIGHT}`)
    .join(" ");
  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      role="img"
      aria-label="הציונים האחרונים"
    >
      <polyline points={points} fill="none" stroke="var(--color-primary)" strokeWidth="2" />
    </svg>
  );
}

export default function ScoreBadge({ score, history = [] }) {
  const hasScore = score !== null && score !== undefined;
  const level = scoreLevel(score);
  return (
    <section className="card score-badge" aria-live="polite">
      <h2>ציון קשב נוכחי</h2>
      {hasScore ? (
        <>
          <p className="score-value" style={{ color: level.colorVar }}>
            {score.toFixed(2)} <span className="score-word">{level.label}</span>
          </p>
          <div className="score-bar">
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
