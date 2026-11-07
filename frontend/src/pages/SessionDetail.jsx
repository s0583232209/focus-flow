import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getContent, getSession } from "../api/client.js";
import ScoreChart from "../components/ScoreChart.jsx";
import { scoreLevel } from "../components/ScoreLevel.js";
import { formatDateTime, formatPosition } from "../components/format.js";

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [contentType, setContentType] = useState("youtube");
  const [state, setState] = useState("loading"); // loading | ready | notfound | error
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await getSession(id);
      setSession(data);
      try {
        setContentType((await getContent(data.content_id)).type);
      } catch {
        // Positions fall back to seconds if the item cannot be read.
      }
      setState("ready");
    } catch (cause) {
      if (cause.status === 404) {
        setState("notfound");
      } else {
        setError(cause.message);
        setState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <main className="container">
        <p>טוען...</p>
      </main>
    );
  }

  if (state === "notfound") {
    return (
      <main className="container">
        <h1>הסשן לא נמצא</h1>
        <Link to="/history">חזרה להיסטוריה</Link>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="container">
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn" onClick={load}>
            נסו שוב
          </button>
        </div>
      </main>
    );
  }

  const average = session.average_score;

  return (
    <main className="container">
      <h1>פרטי סשן</h1>
      <section className="card">
        <p className="cell-title">
          תוכן: <Link to={`/content/${session.content_id}`}>{session.content_title}</Link>
        </p>
        <p>התחלה: {formatDateTime(session.started_at)}</p>
        <p>סיום: {session.ended_at ? formatDateTime(session.ended_at) : "לא הסתיים"}</p>
        <p>מדידות: {session.reading_count}</p>
        <p>
          ציון ממוצע:{" "}
          {average === null ? "אין מדידות" : `${average.toFixed(2)} ${scoreLevel(average).label}`}
        </p>
      </section>

      {session.readings.length > 0 ? (
        <>
          <section className="card">
            <h2>הציון לאורך התוכן</h2>
            <ScoreChart readings={session.readings} contentType={contentType} />
          </section>
          <section className="card">
            <h2>המדידות</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">מיקום</th>
                    <th scope="col">ציון</th>
                    <th scope="col">זמן</th>
                  </tr>
                </thead>
                <tbody>
                  {session.readings.map((reading, index) => (
                    <tr key={index}>
                      <td>{formatPosition(reading.position, contentType)}</td>
                      <td>{reading.score.toFixed(2)}</td>
                      <td>{formatDateTime(reading.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <p>לא נשמרו מדידות בסשן הזה.</p>
      )}

      <Link to="/history">חזרה להיסטוריה</Link>
    </main>
  );
}
