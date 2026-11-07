import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSessions } from "../api/client.js";
import { scoreLevel } from "../components/ScoreLevel.js";
import { formatDateTime, formatDuration } from "../components/format.js";

export default function History() {
  const [sessions, setSessions] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setSessions(null);
    try {
      setSessions(await listSessions());
    } catch (cause) {
      setError(cause.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="container">
      <h1>היסטוריית סשנים</h1>
      {error && (
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={load}>
            נסו שוב
          </button>
        </div>
      )}
      {!error && sessions === null && <p>טוען את ההיסטוריה...</p>}
      {sessions?.length === 0 && <p>עדיין אין סשנים. פתחו פריט מהספרייה והתחילו סשן.</p>}
      {sessions?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">תאריך</th>
                <th scope="col">תוכן</th>
                <th scope="col">משך</th>
                <th scope="col">מדידות</th>
                <th scope="col">ציון ממוצע</th>
                <th scope="col">
                  <span className="visually-hidden">פרטים</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const level = scoreLevel(session.average_score);
                return (
                  <tr key={session.id}>
                    <td>{formatDateTime(session.started_at)}</td>
                    <td className="cell-title">{session.content_title}</td>
                    <td>
                      {session.ended_at
                        ? formatDuration(session.started_at, session.ended_at)
                        : "לא הסתיים"}
                    </td>
                    <td>{session.reading_count}</td>
                    <td style={{ color: level.colorVar }}>
                      {session.average_score === null
                        ? level.label
                        : `${session.average_score.toFixed(2)} ${level.label}`}
                    </td>
                    <td>
                      <Link to={`/history/${session.id}`}>פרטים</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
