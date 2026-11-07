import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  endSession,
  endSessionOnLeave,
  getContent,
  postReading,
  startSession,
} from "../api/client.js";
import CameraPanel from "../components/CameraPanel.jsx";
import LowFocusAlert from "../components/LowFocusAlert.jsx";
import { scoreLevel } from "../components/ScoreLevel.js";
import ScoreBadge from "../components/ScoreBadge.jsx";
import TextReader from "../components/TextReader.jsx";
import YouTubePlayer from "../components/YouTubePlayer.jsx";

function formatElapsed(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function SessionTimer() {
  const [start] = useState(() => Date.now());
  const [now, setNow] = useState(start);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <strong>{formatElapsed(Math.floor((now - start) / 1000))}</strong>;
}

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
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | notfound | error
  const [loadError, setLoadError] = useState("");

  const [sessionId, setSessionId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [summary, setSummary] = useState(null);
  const [closedByServer, setClosedByServer] = useState(false);
  const [readingWarning, setReadingWarning] = useState(false);
  const [scores, setScores] = useState([]);

  const playerRef = useRef(null);
  const cameraRef = useRef(null);
  // Read by the leave handlers and by the score callback, which outlive a render.
  const activeSessionRef = useRef(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      setContent(await getContent(id));
      setLoadState("ready");
    } catch (error) {
      if (error.status === 404) {
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

  // Leaving the page must not leave an open session behind.
  useEffect(() => {
    const finish = () => {
      if (activeSessionRef.current) {
        endSessionOnLeave(activeSessionRef.current);
        activeSessionRef.current = null;
      }
    };
    window.addEventListener("pagehide", finish);
    return () => {
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, []);

  async function handleStart() {
    setBusy(true);
    setSessionError("");
    setSummary(null);
    setScores([]);
    setClosedByServer(false);
    setReadingWarning(false);
    try {
      const session = await startSession(id);
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
      const result = await endSession(sessionId);
      activeSessionRef.current = null;
      cameraRef.current?.stop();
      setSessionId(null);
      setClosedByServer(false);
      setSummary(result);
    } catch (error) {
      setSessionError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleScore(score) {
    setScores((current) => [...current, score]);
    const session = activeSessionRef.current;
    if (!session) return;
    try {
      await postReading(session, { position: playerRef.current?.getPosition() ?? 0, score });
      setReadingWarning(false);
    } catch (error) {
      if (error.status === 409) {
        activeSessionRef.current = null;
        setClosedByServer(true);
      } else {
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

  const active = sessionId !== null;
  const lastScore = active && scores.length > 0 ? scores[scores.length - 1] : null;

  return (
    <main className="container">
      <h1 className="watch-title">{content.title}</h1>
      <div className="watch-layout">
        <div className="watch-content">
          {content.type === "youtube" ? (
            <YouTubePlayer ref={playerRef} videoId={content.video_id} />
          ) : (
            <TextReader ref={playerRef} text={content.source} />
          )}
        </div>
        <aside className="watch-side">
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
          <CameraPanel ref={cameraRef} sessionActive={active} onScore={handleScore} />
          <ScoreBadge score={lastScore} history={active ? scores : []} />
          <LowFocusAlert score={lastScore} onRewind={() => playerRef.current?.seekBy(-15)} />
        </aside>
      </div>
    </main>
  );
}
