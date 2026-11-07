import { useRef, useState } from "react";
import CameraPanel from "../components/CameraPanel.jsx";
import LowFocusAlert from "../components/LowFocusAlert.jsx";
import ScoreBadge from "../components/ScoreBadge.jsx";
import TextReader from "../components/TextReader.jsx";
import YouTubePlayer from "../components/YouTubePlayer.jsx";

const SAMPLE_TEXT = Array.from(
  { length: 40 },
  (_, index) => `פסקה ${index + 1}. <b>תג</b> שמוצג כטקסט רגיל, כדי לבדוק גלילה ומיקום בקריאה.`,
).join("\n\n");

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

// Dev-only page: tests the measurement and the viewers with no server. Not in the production build.
export default function Lab() {
  const [sessionActive, setSessionActive] = useState(true);
  const [scores, setScores] = useState([]);
  const lastScore = scores.length > 0 ? scores[scores.length - 1] : null;
  const videoRef = useRef(null);
  const textRef = useRef(null);

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
      <CameraPanel
        sessionActive={sessionActive}
        onScore={(score) => {
          console.log("score", score.toFixed(3));
          setScores((current) => [...current, score]);
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
