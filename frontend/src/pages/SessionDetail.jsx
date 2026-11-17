// דף פרטי סשן: סיכום, גרף הציון לאורך התוכן, וטבלת כל המדידות.
import { useCallback, useEffect, useState } from "react"; // hooks של React
import { Link, useParams } from "react-router-dom"; // useParams קורא את :id מהכתובת
import { getContent, getSession } from "../api/client.js"; // קריאות לשרת
import ScoreChart from "../components/ScoreChart.jsx"; // הגרף
import { scoreLevel } from "../components/ScoreLevel.js"; // מילת הציון
import { formatDateTime, formatPosition } from "../components/format.js"; // עיצוב

export default function SessionDetail() {
  const { id } = useParams(); // מזהה הסשן מהכתובת /history/:id
  const [session, setSession] = useState(null); // נתוני הסשן
  const [contentType, setContentType] = useState("youtube"); // סוג התוכן – קובע איך מציגים מיקום (שניות או %)
  const [state, setState] = useState("loading"); // loading | ready | notfound | error
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const data = await getSession(id); // הסשן עם המדידות
      setSession(data);
      try {
        setContentType((await getContent(data.content_id)).type); // שואלים מה סוג התוכן
      } catch {
        // אם אי אפשר לקרוא את הפריט (למשל נמחק) – המיקומים יוצגו כשניות
      }
      setState("ready");
    } catch (cause) {
      if (cause.status === 404) { // לא קיים או של משתמש אחר
        setState("notfound");
      } else {
        setError(cause.message);
        setState("error");
      }
    }
  }, [id]); // נוצרת מחדש אם המזהה בכתובת משתנה

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

  // סשן של משתמש אחר או שלא קיים – רק ההודעה, בלי שום מידע נוסף
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

  const average = session.average_score; // קיצור לשימוש למטה

  return (
    <main className="container">
      <h1>פרטי סשן</h1>
      {/* כרטיס הסיכום */}
      <section className="card">
        <p className="cell-title">
          תוכן: <Link to={`/content/${session.content_id}`}>{session.content_title}</Link>
        </p>
        <p>התחלה: {formatDateTime(session.started_at)}</p>
        <p>סיום: {session.ended_at ? formatDateTime(session.ended_at) : "לא הסתיים"}</p>
        <p>מדידות: {session.reading_count}</p>
        <p>
          {/* {" "} מוסיף רווח שאחרת JSX היה מוחק בסוף השורה */}
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
                  {/* שורה לכל מדידה */}
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
