import { useState } from "react";
import CameraPanel from "../components/CameraPanel.jsx";
import LowFocusAlert from "../components/LowFocusAlert.jsx";
import ScoreBadge from "../components/ScoreBadge.jsx";

// Dev-only page: tests the measurement with no server. Not part of the production build.
export default function Lab() {
  const [sessionActive, setSessionActive] = useState(true);
  const [scores, setScores] = useState([]);
  const lastScore = scores.length > 0 ? scores[scores.length - 1] : null;

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
    </main>
  );
}
