import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useAttention } from "../attention/useAttention.js";

const DENIED = "לא התקבלה גישה למצלמה. אפשר להמשיך לצפות בלי מדידה.";
const NO_HTTPS = "המצלמה זמינה רק בחיבור מאובטח (https)";

const CameraPanel = forwardRef(function CameraPanel({ sessionActive, onScore }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [phase, setPhase] = useState("off"); // off | consent | starting | on
  const [message, setMessage] = useState("");
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const sessionActiveRef = useRef(sessionActive);
  sessionActiveRef.current = sessionActive;

  const { status, progress, error } = useAttention({
    videoRef,
    enabled: phase === "on",
    onScore: (score, raw) => {
      if (sessionActiveRef.current) onScore?.(score, raw);
    },
  });

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const turnOff = useCallback(() => {
    stopTracks();
    setPhase("off");
  }, [stopTracks]);

  useImperativeHandle(ref, () => ({ stop: turnOff }), [turnOff]);
  useEffect(() => stopTracks, [stopTracks]);

  async function openStream(id) {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage(NO_HTTPS);
      setPhase("off");
      return;
    }
    setPhase("starting");
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, ...(id ? { deviceId: { exact: id } } : {}) },
      });
      streamRef.current = stream;
      setPhase("on");
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter((device) => device.kind === "videoinput"));
      setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? id ?? "");
    } catch (cause) {
      console.error(cause);
      setMessage(DENIED);
      setPhase("off");
    }
  }

  // The <video> exists only while the camera is on, so it is attached here.
  useEffect(() => {
    if (phase === "on" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [phase, deviceId]);

  return (
    <section className="card camera-panel" aria-label="מצלמה ומדידת קשב">
      {phase === "off" && (
        <button type="button" className="btn btn-primary" onClick={() => setPhase("consent")}>
          הפעלת מצלמה למדידת קשב
        </button>
      )}

      {phase === "consent" && (
        <div role="dialog" aria-label="הסבר על המצלמה" className="notice">
          <p>
            המצלמה משמשת רק לחישוב ציון קשב. הווידאו ונקודות הפנים לא נשלחים ולא נשמרים – הם מעובדים
            במחשב שלכם בלבד. לשרת נשלח רק מספר בין 0 ל-1 כל 2 שניות, יחד עם המיקום בתוכן. אפשר לכבות
            בכל רגע.
          </p>
          <div className="button-row">
            <button type="button" className="btn btn-primary" onClick={() => openStream(deviceId)}>
              מסכים/ה – הפעלת מצלמה
            </button>
            <button type="button" className="btn" onClick={() => setPhase("off")}>
              לא עכשיו
            </button>
          </div>
        </div>
      )}

      {phase === "starting" && <p>מפעיל את המצלמה...</p>}

      {message && (
        <p className="notice notice-warning" role="alert">
          {message}
        </p>
      )}

      {phase === "on" && (
        <>
          <video ref={videoRef} className="camera-preview" muted playsInline />
          {devices.length > 0 && (
            <div className="field">
              <label htmlFor="camera-select">בחירת מצלמה</label>
              <select
                id="camera-select"
                value={deviceId}
                onChange={(event) => openStream(event.target.value)}
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId || index} value={device.deviceId}>
                    {device.label || `מצלמה ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          {status === "loading" && <p>טוען את מודל הקשב...</p>}
          {status === "collecting" && (
            <div>
              <p>אוסף נתונים – הציון הראשון יופיע בעוד כ-10 שניות</p>
              <progress max={1} value={progress} aria-label="התקדמות איסוף הנתונים" />
            </div>
          )}
          {status === "no_face" && (
            <p className="notice notice-warning" role="status">
              לא זוהו פנים. ודאו שהפנים מול המצלמה ושיש מספיק תאורה.
            </p>
          )}
          {status === "error" && (
            <p className="notice notice-error" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="btn" onClick={turnOff}>
            כיבוי מצלמה
          </button>
        </>
      )}
    </section>
  );
});

export default CameraPanel;
