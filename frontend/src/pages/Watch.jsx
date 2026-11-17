// דף הצפייה – כאן הכל מתחבר: התוכן (סרטון או טקסט), הסשן, המצלמה, הציון וההתראה.
import { useCallback, useEffect, useRef, useState } from "react"; // hooks של React
import { Link, useParams } from "react-router-dom"; // קישור, וקריאת :id מהכתובת
import { // קריאות לשרת
  endSession,
  endSessionOnLeave,
  getContent,
  postReading,
  startSession,
} from "../api/client.js";
import CameraPanel from "../components/CameraPanel.jsx"; // פאנל המצלמה
import LowFocusAlert from "../components/LowFocusAlert.jsx"; // התראת קשב נמוך
import { scoreLevel } from "../components/ScoreLevel.js"; // מילת הציון
import ScoreBadge from "../components/ScoreBadge.jsx"; // תצוגת הציון
import TextReader from "../components/TextReader.jsx"; // תצוגת טקסט
import YouTubePlayer from "../components/YouTubePlayer.jsx"; // נגן סרטונים

// שניות שעברו → mm:ss
function formatElapsed(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// טיימר שרץ מרגע שהסשן התחיל. רכיב נפרד, כדי שרק הוא יתרנדר כל שנייה ולא כל הדף
function SessionTimer() {
  const [start] = useState(() => Date.now()); // זמן ההתחלה; הפונקציה רצה רק בפעם הראשונה
  const [now, setNow] = useState(start); // הזמן הנוכחי
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000); // עדכון כל שנייה
    return () => clearInterval(timer); // עצירה כשהרכיב מוסר
  }, []);
  return <strong>{formatElapsed(Math.floor((now - start) / 1000))}</strong>;
}

// כרטיס הסיכום שמופיע אחרי "סיום סשן"
function SessionSummary({ summary, onNew }) {
  const average = summary.average_score;
  return (
    <section className="card" role="status">
      <h2>הסשן הסתיים</h2>
      <p>מדידות: {summary.reading_count}</p>
      <p>
        ציון ממוצע:{" "}
        {average === null ? "אין מדידות" : `${average.toFixed(2)} ${scoreLevel(average).label}`}
      </p>
      <div className="button-row">
        <Link className="btn btn-primary" to={`/history/${summary.id}`}>
          לצפייה בהיסטוריה
        </Link>
        <button type="button" className="btn" onClick={onNew}>
          סשן חדש
        </button>
      </div>
    </section>
  );
}

export default function Watch() {
  const { id } = useParams(); // מזהה הפריט מהכתובת /content/:id
  const [content, setContent] = useState(null); // הפריט
  const [loadState, setLoadState] = useState("loading"); // loading | ready | notfound | error
  const [loadError, setLoadError] = useState("");

  const [sessionId, setSessionId] = useState(null); // מזהה הסשן הפעיל (null = אין סשן)
  const [busy, setBusy] = useState(false); // באמצע התחלה/סיום
  const [sessionError, setSessionError] = useState("");
  const [summary, setSummary] = useState(null); // סיכום אחרי סיום
  const [closedByServer, setClosedByServer] = useState(false); // השרת החזיר 409 – הסשן נסגר במקום אחר
  const [readingWarning, setReadingWarning] = useState(false); // מדידה אחת לא נשמרה (תקלת רשת)
  const [scores, setScores] = useState([]); // כל הציונים בסשן – ל-sparkline

  const playerRef = useRef(null); // הנגן או תצוגת הטקסט (getPosition / seekBy)
  const cameraRef = useRef(null); // פאנל המצלמה (stop)
  // מזהה הסשן הפעיל ב-ref: הוא נקרא בפונקציות שחיות יותר מרינדור אחד (יציאה מהדף, קבלת ציון),
  // ו-ref תמיד מחזיק את הערך העדכני, בניגוד ל-state שנלכד בזמן יצירת הפונקציה
  const activeSessionRef = useRef(null);

  // טעינת הפריט
  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      setContent(await getContent(id));
      setLoadState("ready");
    } catch (error) {
      if (error.status === 404) { // לא קיים או של משתמש אחר
        setLoadState("notfound");
      } else {
        setLoadError(error.message);
        setLoadState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // יציאה מהדף לא יכולה להשאיר סשן פתוח
  useEffect(() => {
    const finish = () => {
      if (activeSessionRef.current) { // יש סשן פעיל
        endSessionOnLeave(activeSessionRef.current); // בקשת סיום עם keepalive
        activeSessionRef.current = null; // לא לשלוח פעמיים
      }
    };
    window.addEventListener("pagehide", finish); // סגירת לשונית / מעבר לאתר אחר
    return () => { // מעבר לדף אחר בתוך האתר (הרכיב מוסר)
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, []);

  async function handleStart() {
    setBusy(true);
    // איפוס כל מה שנשאר מסשן קודם
    setSessionError("");
    setSummary(null);
    setScores([]);
    setClosedByServer(false);
    setReadingWarning(false);
    try {
      const session = await startSession(id); // השרת יוצר סשן
      activeSessionRef.current = session.id;
      setSessionId(session.id);
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleEnd() {
    setBusy(true);
    setSessionError("");
    try {
      const result = await endSession(sessionId); // השרת סוגר ומחזיר סיכום
      activeSessionRef.current = null;
      cameraRef.current?.stop(); // מכבים את המצלמה
      setSessionId(null);
      setClosedByServer(false);
      setSummary(result); // מציגים את כרטיס הסיכום
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  // נקרא מפאנל המצלמה עם כל ציון חדש (כל 2 שניות)
  async function handleScore(score) {
    setScores((current) => [...current, score]); // מוסיפים לגרף הקטן
    const session = activeSessionRef.current;
    if (!session) return; // אין סשן פעיל – לא שולחים
    try {
      // שולחים את הציון יחד עם המיקום הנוכחי בתוכן (שניות או אחוז). ?? 0 – אם אין נגן
      await postReading(session, { position: playerRef.current?.getPosition() ?? 0, score });
      setReadingWarning(false); // הצליח – מסתירים אזהרה קודמת
    } catch (error) {
      if (error.status === 409) { // הסשן נסגר (למשל מלשונית אחרת) – מפסיקים לשלוח
        activeSessionRef.current = null;
        setClosedByServer(true);
      } else { // תקלה זמנית – מציגים אזהרה קטנה וממשיכים למדוד
        setReadingWarning(true);
      }
    }
  }

  if (loadState === "loading") {
    return (
      <main className="container">
        <p>טוען...</p>
      </main>
    );
  }

  // פריט של משתמש אחר – רק ההודעה, בלי שום מידע עליו
  if (loadState === "notfound") {
    return (
      <main className="container">
        <h1>הפריט לא נמצא</h1>
        <Link to="/library">חזרה לספרייה</Link>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="container">
        <div className="notice notice-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="btn" onClick={load}>
            נסו שוב
          </button>
        </div>
      </main>
    );
  }

  const active = sessionId !== null; // האם יש סשן פעיל
  const lastScore = active && scores.length > 0 ? scores[scores.length - 1] : null; // הציון האחרון (רק בסשן פעיל)

  return (
    <main className="container">
      <h1 className="watch-title">{content.title}</h1>
      {/* שתי עמודות במסך רחב; מתחת ל-900px התוכן מעל הפאנל (ב-CSS) */}
      <div className="watch-layout">
        <div className="watch-content">
          {/* אותו playerRef לשני הסוגים – כי לשניהם אותו ממשק */}
          {content.type === "youtube" ? (
            <YouTubePlayer ref={playerRef} videoId={content.video_id} />
          ) : (
            <TextReader ref={playerRef} text={content.source} />
          )}
        </div>
        <aside className="watch-side">
          {/* תיבת הסשן: סיכום / סשן פעיל / לפני התחלה */}
          {summary ? (
            <SessionSummary summary={summary} onNew={handleStart} />
          ) : (
            <section className="card">
              {active ? (
                <>
                  <p>
                    הסשן פעיל · <SessionTimer />
                  </p>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleEnd}
                    disabled={busy}
                  >
                    {busy ? "מסיים..." : "סיום סשן"}
                  </button>
                </>
              ) : (
                <>
                  <p>סשן = צפייה אחת בפריט עם מדידת קשב</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleStart}
                    disabled={busy}
                  >
                    {busy ? "מתחיל..." : "התחלת סשן"}
                  </button>
                </>
              )}
              {sessionError && (
                <p className="error" role="alert">
                  {sessionError}
                </p>
              )}
            </section>
          )}
          {closedByServer && (
            <p className="notice notice-warning" role="status">
              הסשן נסגר
            </p>
          )}
          {readingWarning && (
            <p className="notice notice-warning" role="status">
              מדידה אחת לא נשמרה
            </p>
          )}
          {/* המצלמה עובדת גם בלי סשן, אבל ציונים נשלחים רק כשהסשן פעיל */}
          <CameraPanel ref={cameraRef} sessionActive={active} onScore={handleScore} />
          <ScoreBadge score={lastScore} history={active ? scores : []} />
          {/* "חזרה 15 שניות" מחזיר את הנגן אחורה (או גולל טקסט למעלה) */}
          <LowFocusAlert score={lastScore} onRewind={() => playerRef.current?.seekBy(-15)} />
        </aside>
      </div>
    </main>
  );
}
