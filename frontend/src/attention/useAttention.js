// "המוח" של המדידה: hook שדוגם את המצלמה 10 פעמים בשנייה, מחזיק חלון נע של 100 פריימים,
// ומריץ את המודל כל 2 שניות. בלי פנים יותר משנייה – מאפס את החלון ולא מריץ את המודל.
import { useEffect, useRef, useState } from "react"; // hooks של React
import { loadModel, predict } from "./attentionModel.js"; // המודל
import { createFaceTracker } from "./faceTracker.js"; // זיהוי הפנים

const TICK_MS = 100; // 10 פריימים בשנייה – הקצב שעליו המודל אומן
const WINDOW_FRAMES = 100; // גודל החלון: 100 פריימים = 10 שניות
const FRAME_SIZE = 478 * 3; // כמה מספרים בפריים אחד (478 נקודות × x,y,z)
const NO_FACE_TICKS = 10; // שנייה אחת בלי פנים → "לא זוהו פנים"
const TICKS_BETWEEN_PREDICTIONS = 20; // 20 פריימים × 100ms = ציון כל 2 שניות

// videoRef = הפניה לאלמנט הווידאו של המצלמה; enabled = האם למדוד; onScore = נקרא עם כל ציון
export function useAttention({ videoRef, enabled, onScore }) {
  const [status, setStatus] = useState("idle"); // idle | loading | collecting | no_face | measuring | error
  const [progress, setProgress] = useState(0); // כמה מהחלון כבר מלא (0 עד 1)
  const [lastScore, setLastScore] = useState(null); // הציון האחרון
  const [error, setError] = useState(null); // הודעת שגיאה בעברית

  // onScore היא פונקציה חדשה בכל רינדור של ההורה; הלולאה לא צריכה להתחיל מחדש בגללה,
  // ולכן שומרים את הגרסה העדכנית ב-ref ולא בתלויות של useEffect
  const onScoreRef = useRef(onScore);
  onScoreRef.current = onScore;

  useEffect(() => {
    if (!enabled) { // המדידה כבויה
      setStatus("idle");
      setProgress(0);
      return undefined; // אין מה לנקות
    }

    let stopped = false; // הופך ל-true בניקוי – כל קוד אסינכרוני בודק אותו
    let timer = null; // הטיימר של הלולאה
    let tracker = null; // גלאי הפנים

    // "חוצץ טבעתי" (ring buffer): מערך קבוע של 100 פריימים; כשמגיעים לסוף כותבים שוב מההתחלה
    const buffer = new Float32Array(WINDOW_FRAMES * FRAME_SIZE);
    let writeIndex = 0; // לאיזה מקום ייכתב הפריים הבא
    let count = 0; // כמה פריימים תקינים יש בחלון (עד 100)
    let missedTicks = 0; // כמה פריימים ברצף בלי פנים
    let ticksSincePrediction = 0; // כמה פריימים מאז הציון האחרון
    let busy = false; // המודל רץ עכשיו – לא מתחילים הרצה נוספת במקביל

    // מחזיר עותק של החוצץ לפי סדר הזמן: הפריים הישן ראשון
    function chronologicalWindow() {
      const copy = new Float32Array(buffer.length);
      const split = writeIndex * FRAME_SIZE; // הנקודה שבה נמצא הפריים הישן ביותר
      copy.set(buffer.subarray(split)); // קודם החלק מהישן ועד סוף המערך
      copy.set(buffer.subarray(0, split), buffer.length - split); // ואחריו החלק מתחילת המערך (החדש)
      return copy;
    }

    async function runPrediction() {
      busy = true;
      try {
        const { score, raw } = await predict(chronologicalWindow()); // הרצת המודל
        if (stopped) return; // בינתיים המדידה נעצרה
        setLastScore(score);
        setStatus((current) => (current === "no_face" ? current : "measuring")); // אם בינתיים הפנים נעלמו – משאירים no_face
        onScoreRef.current?.(score, raw); // מודיעים להורה (דף הצפייה ישלח לשרת)
      } catch (cause) {
        console.error(cause);
      } finally {
        busy = false; // תמיד משחררים, גם בשגיאה
      }
    }

    // רץ כל 100ms
    function tick() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return; // הווידאו עוד לא מוכן (readyState 2 = יש פריים נוכחי)

      let frame = null;
      try {
        frame = tracker.detect(video, performance.now()); // זיהוי פנים בפריים הנוכחי
      } catch (cause) {
        console.error(cause);
      }

      if (!frame) { // אין פנים בפריים
        missedTicks += 1;
        if (missedTicks >= NO_FACE_TICKS) { // שנייה שלמה בלי פנים
          // החלון חייב להכיל רק פריימים רצופים, אז מתחילים אותו מחדש
          count = 0;
          writeIndex = 0;
          ticksSincePrediction = 0;
          setProgress(0);
          setStatus("no_face");
        }
        return; // לא מריצים את המודל
      }

      missedTicks = 0; // יש פנים – מאפסים את מונה ההחמצות
      buffer.set(frame, writeIndex * FRAME_SIZE); // כותבים את הפריים למקום הבא בחוצץ
      writeIndex = (writeIndex + 1) % WINDOW_FRAMES; // מתקדמים; אחרי 99 חוזרים ל-0

      if (count < WINDOW_FRAMES) { // החלון עוד מתמלא
        count += 1;
        setProgress(count / WINDOW_FRAMES);
        if (count < WINDOW_FRAMES) { // עדיין לא מלא
          setStatus("collecting");
          return;
        }
        ticksSincePrediction = TICKS_BETWEEN_PREDICTIONS; // ציון ראשון מיד כשהחלון התמלא
      } else { // החלון מלא – כל פריים חדש דוחף החוצה את הישן ביותר
        setStatus((current) => (current === "no_face" ? "collecting" : current));
        ticksSincePrediction += 1;
      }

      // הגיע הזמן לציון, והמודל לא באמצע הרצה קודמת
      if (ticksSincePrediction >= TICKS_BETWEEN_PREDICTIONS && !busy) {
        ticksSincePrediction = 0;
        runPrediction(); // בלי await – הלולאה ממשיכה לדגום בזמן שהמודל רץ
      }
    }

    // התחלה: מאפסים את המצב
    setStatus("loading");
    setError(null);
    setLastScore(null);
    setProgress(0);

    // טוענים במקביל את גלאי הפנים ואת המודל
    Promise.all([createFaceTracker(), loadModel()])
      .then(([createdTracker]) => { // לוקחים רק את התוצאה הראשונה (הגלאי)
        if (stopped) { // בינתיים המדידה בוטלה
          createdTracker.close();
          return;
        }
        tracker = createdTracker;
        setStatus("collecting");
        timer = setInterval(tick, TICK_MS); // מפעילים את הלולאה
      })
      .catch((cause) => {
        console.error(cause);
        if (stopped) return;
        setError("לא הצלחנו לטעון את מודל הקשב. רעננו את הדף ונסו שוב.");
        setStatus("error");
      });

    return () => { // ניקוי: כשהמדידה נכבית או הרכיב מוסר
      stopped = true;
      if (timer) clearInterval(timer); // עצירת הלולאה
      tracker?.close(); // שחרור הגלאי
    };
  }, [enabled, videoRef]); // רץ מחדש רק כשמדליקים/מכבים את המדידה

  return { status, progress, lastScore, error }; // מה שהרכיב שמשתמש ב-hook מקבל
}
