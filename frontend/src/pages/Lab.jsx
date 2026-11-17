// דף ניסוי לפיתוח בלבד (/lab): בודק את המדידה ואת הנגנים בלי שרת. לא נכנס לבנייה לייצור.
import { useRef, useState } from "react"; // hooks של React
import CameraPanel from "../components/CameraPanel.jsx"; // פאנל המצלמה
import LowFocusAlert from "../components/LowFocusAlert.jsx"; // התראת קשב נמוך
import ScoreBadge from "../components/ScoreBadge.jsx"; // תצוגת הציון
import TextReader from "../components/TextReader.jsx"; // תצוגת טקסט
import YouTubePlayer from "../components/YouTubePlayer.jsx"; // נגן YouTube

// טקסט דוגמה ארוך: 40 פסקאות, מופרדות בשורה ריקה. התגית <b> בודקת שהטקסט מוצג כטקסט ולא כ-HTML
const SAMPLE_TEXT = Array.from(
  { length: 40 }, // יוצר מערך באורך 40
  (_, index) => `פסקה ${index + 1}. <b>תג</b> שמוצג כטקסט רגיל, כדי לבדוק גלילה ומיקום בקריאה.`,
).join("\n\n");

// כפתורי בדיקה לנגן: הצגת המיקום הנוכחי וחזרה 15 שניות
function ViewerControls({ viewerRef }) {
  const [position, setPosition] = useState(null);
  return (
    <p className="button-row">
      <button
        type="button"
        className="btn"
        onClick={() => setPosition(viewerRef.current?.getPosition())}
      >
        מיקום נוכחי
      </button>
      <button type="button" className="btn" onClick={() => viewerRef.current?.seekBy(-15)}>
        חזרה 15 שניות
      </button>
      {position !== null && <span>{position}</span>}
    </p>
  );
}

export default function Lab() {
  const [sessionActive, setSessionActive] = useState(true); // מדמה "סשן פעיל"
  const [scores, setScores] = useState([]); // כל הציונים שהתקבלו
  const lastScore = scores.length > 0 ? scores[scores.length - 1] : null; // הציון האחרון
  const videoRef = useRef(null); // ref לנגן הסרטון
  const textRef = useRef(null); // ref לתצוגת הטקסט

  return (
    <main className="container">
      <h1>מעבדת מדידה</h1>
      <p>
        <label>
          <input
            type="checkbox"
            checked={sessionActive}
            onChange={(event) => setSessionActive(event.target.checked)}
          />{" "}
          סשן פעיל (onScore נקרא רק כשמסומן)
        </label>
      </p>
      {/* כל ציון מודפס לקונסול ונוסף לרשימה */}
      <CameraPanel
        sessionActive={sessionActive}
        onScore={(score) => {
          console.log("score", score.toFixed(3));
          setScores((current) => [...current, score]); // מערך חדש עם הציון בסוף
        }}
      />
      <ScoreBadge score={lastScore} history={scores} />
      <LowFocusAlert score={lastScore} onRewind={() => console.log("rewind 15 seconds")} />

      <h2>סרטון</h2>
      <YouTubePlayer ref={videoRef} videoId="dQw4w9WgXcQ" />
      <ViewerControls viewerRef={videoRef} />

      <h2>טקסט</h2>
      <TextReader ref={textRef} text={SAMPLE_TEXT} />
      <ViewerControls viewerRef={textRef} />
    </main>
  );
}
