import { useEffect, useRef, useState } from "react";

const LOW_SCORE = 0.4;
const QUIET_MS = 30_000;

export default function LowFocusAlert({ score, onRewind }) {
  const [closedAt, setClosedAt] = useState(null);
  const [, setTick] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const isLow = score !== null && score !== undefined && score < LOW_SCORE;
  const quiet = closedAt !== null && Date.now() - closedAt < QUIET_MS;
  if (!isLow || quiet) return null;

  function close() {
    setClosedAt(Date.now());
    // Re-render when the quiet time is over, in case the score has not changed.
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setTick((value) => value + 1), QUIET_MS);
  }

  return (
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
