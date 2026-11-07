import { useEffect, useRef, useState } from "react";
import { useAttention } from "../attention/useAttention.js";

// Dev-only page: tests the measurement with no server. Not part of the production build.
export default function Lab() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");

  const { status, progress, lastScore, error } = useAttention({
    videoRef,
    enabled,
    onScore: (score) => console.log("score", score.toFixed(3)),
  });

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  async function startCamera(id = deviceId) {
    stopStream();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, ...(id ? { deviceId: { exact: id } } : {}) },
    });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((device) => device.kind === "videoinput"));
    setEnabled(true);
  }

  useEffect(() => stopStream, []);

  return (
    <main className="container">
      <h1>מעבדת מדידה</h1>
      <p>
        <button type="button" className="btn btn-primary" onClick={() => startCamera()}>
          הפעלת מצלמה
        </button>
      </p>
      {devices.length > 0 && (
        <div className="field">
          <label htmlFor="lab-camera">בחירת מצלמה</label>
          <select
            id="lab-camera"
            value={deviceId}
            onChange={(event) => {
              setDeviceId(event.target.value);
              startCamera(event.target.value);
            }}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || "מצלמה"}
              </option>
            ))}
          </select>
        </div>
      )}
      <video ref={videoRef} muted playsInline width={320} />
      <p>סטטוס: {status}</p>
      <p>התקדמות: {Math.round(progress * 100)}%</p>
      <p>ציון אחרון: {lastScore === null ? "—" : lastScore.toFixed(2)}</p>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
