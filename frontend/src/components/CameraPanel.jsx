// פאנל המצלמה: הסבר והסכמה לפני הדלקה, בחירת מצלמה, תצוגה מקדימה, וסטטוס המדידה.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"; // hooks של React
import { useAttention } from "../attention/useAttention.js"; // לולאת המדידה

const DENIED = "לא התקבלה גישה למצלמה. אפשר להמשיך לצפות בלי מדידה."; // הודעה כשהמשתמש סירב או שאין מצלמה
const NO_HTTPS = "המצלמה זמינה רק בחיבור מאובטח (https)"; // הדפדפן חוסם מצלמה בחיבור לא מאובטח

// sessionActive = האם יש סשן פעיל (רק אז שולחים ציונים); onScore = מה לעשות עם כל ציון
const CameraPanel = forwardRef(function CameraPanel({ sessionActive, onScore }, ref) {
  const videoRef = useRef(null); // אלמנט ה-<video> של התצוגה המקדימה
  const streamRef = useRef(null); // זרם המצלמה הפעיל
  const [phase, setPhase] = useState("off"); // off | consent | starting | on
  const [message, setMessage] = useState(""); // הודעת שגיאה למשתמש
  const [devices, setDevices] = useState([]); // רשימת המצלמות במחשב
  const [deviceId, setDeviceId] = useState(""); // המצלמה שנבחרה
  // ref עם הערך העדכני של sessionActive – כדי שהפונקציה למטה תמיד תראה את הערך הנוכחי
  const sessionActiveRef = useRef(sessionActive);
  sessionActiveRef.current = sessionActive;

  // מפעילים את לולאת המדידה רק כשהמצלמה דלוקה
  const { status, progress, error } = useAttention({
    videoRef,
    enabled: phase === "on",
    onScore: (score, raw) => {
      if (sessionActiveRef.current) onScore?.(score, raw); // מעבירים ציון הלאה רק כשיש סשן פעיל
    },
  });

  // עוצר את כל ערוצי המצלמה – זה מה שמכבה את נורית המצלמה
  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null; // מנתקים את הווידאו מהזרם
  }, []);

  const turnOff = useCallback(() => {
    stopTracks();
    setPhase("off");
  }, [stopTracks]);

  useImperativeHandle(ref, () => ({ stop: turnOff }), [turnOff]); // דף ההורה יכול לקרוא ל-ref.current.stop()
  useEffect(() => stopTracks, [stopTracks]); // הפונקציה שמוחזרת רצה בהסרת הרכיב: מכבים את המצלמה ביציאה מהדף

  // פותחת זרם מהמצלמה (id = מצלמה מסוימת, או ריק לברירת המחדל)
  async function openStream(id) {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia) { // בחיבור http הדפדפן לא חושף את ה-API בכלל
      setMessage(NO_HTTPS);
      setPhase("off");
      return;
    }
    setPhase("starting");
    stopTracks(); // סוגרים זרם קודם (בהחלפת מצלמה)
    try {
      // getUserMedia מבקש הרשאה מהמשתמש ופותח את המצלמה
      const stream = await navigator.mediaDevices.getUserMedia({
        // ...(תנאי ? {...} : {}) מוסיף את deviceId רק אם נבחרה מצלמה; exact = בדיוק המצלמה הזו
        video: { width: 640, height: 480, ...(id ? { deviceId: { exact: id } } : {}) },
      });
      streamRef.current = stream;
      setPhase("on");
      const all = await navigator.mediaDevices.enumerateDevices(); // רשימת כל ההתקנים (שמות זמינים רק אחרי הרשאה)
      setDevices(all.filter((device) => device.kind === "videoinput")); // רק מצלמות
      // המצלמה שבפועל נפתחה (?? = אם אין, ניקח את id, ואם גם הוא חסר – ריק)
      setDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? id ?? "");
    } catch (cause) { // סירוב (NotAllowedError) או אין מצלמה (NotFoundError)
      console.error(cause);
      setMessage(DENIED);
      setPhase("off");
    }
  }

  // אלמנט ה-<video> קיים רק כשהמצלמה דלוקה, ולכן מחברים אליו את הזרם כאן, אחרי שהוא נוצר
  useEffect(() => {
    if (phase === "on" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current; // מחברים את הזרם לווידאו
      videoRef.current.play().catch(() => {}); // מפעילים ניגון; מתעלמים משגיאה (למשל אם הדפדפן חסם)
    }
  }, [phase, deviceId]);

  return (
    <section className="card camera-panel" aria-label="מצלמה ומדידת קשב">
      {/* שלב 1: כבוי – כפתור שפותח את ההסבר */}
      {phase === "off" && (
        <button type="button" className="btn btn-primary" onClick={() => setPhase("consent")}>
          הפעלת מצלמה למדידת קשב
        </button>
      )}

      {/* שלב 2: הסבר מה נאסף, ואפשרות לסרב */}
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

      {/* שלב 3: מחכים להרשאה ולמצלמה */}
      {phase === "starting" && <p>מפעיל את המצלמה...</p>}

      {/* הודעת שגיאה (סירוב / אין https) */}
      {message && (
        <p className="notice notice-warning" role="alert">
          {message}
        </p>
      )}

      {/* שלב 4: המצלמה דלוקה */}
      {phase === "on" && (
        <>
          {/* muted – בלי קול; playsInline – בטלפון לא נפתח במסך מלא */}
          <video ref={videoRef} className="camera-preview" muted playsInline />
          {/* רשימת בחירת מצלמה – חשוב לבודק שמשתמש ב-OBS Virtual Camera */}
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
          {/* שורות הסטטוס לפי מצב המדידה */}
          {status === "loading" && <p>טוען את מודל הקשב...</p>}
          {status === "collecting" && (
            <div>
              <p>אוסף נתונים – הציון הראשון יופיע בעוד כ-10 שניות</p>
              {/* פס התקדמות: value בין 0 ל-1 */}
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
