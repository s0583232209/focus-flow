// נגן YouTube. "המיקום" של מדידה בסרטון הוא הזמן בשניות.
// חושף את אותו ממשק כמו TextReader: getPosition() ו-seekBy(seconds).
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"; // hooks של React

const API_SRC = "https://www.youtube.com/iframe_api"; // הסקריפט הרשמי של YouTube לשליטה בנגן מ-JavaScript
const API_TIMEOUT_MS = 15_000; // כמה לחכות לטעינת הסקריפט לפני שמכריזים על כישלון
const READY_TIMEOUT_MS = 20_000; // כמה לחכות שהנגן עצמו יהיה מוכן

let apiPromise = null; // משתנה ברמת המודול: Promise אחד משותף לכל הנגנים

// הסקריפט נטען פעם אחת בלבד, לא משנה כמה נגנים המשתמש פותח
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT); // כבר נטען – מחזירים מיד
  if (apiPromise) return apiPromise; // כבר בטעינה – מחכים לאותה טעינה

  apiPromise = new Promise((resolve, reject) => { // Promise = "הבטחה" לתוצאה עתידית
    const fail = () => {
      apiPromise = null; // מאפשרים ניסיון חוזר בפעם הבאה
      reject(new Error("YouTube API failed to load"));
    };
    const timer = setTimeout(fail, API_TIMEOUT_MS); // אם לא נטען בזמן – כישלון
    const previous = window.onYouTubeIframeAPIReady; // אם מישהו אחר כבר הגדיר פונקציה כזו – שומרים אותה
    // YouTube קורא לפונקציה הגלובלית הזו כשהסקריפט מוכן
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer); // מבטלים את טיימר הכישלון
      previous?.(); // קוראים גם לפונקציה הקודמת, אם הייתה
      resolve(window.YT); // ההבטחה מתקיימת עם אובייקט YT
    };
    if (!document.querySelector(`script[src="${API_SRC}"]`)) { // מוסיפים תגית script רק אם עוד אין
      const script = document.createElement("script");
      script.src = API_SRC;
      script.onerror = () => { // הטעינה נכשלה (אין אינטרנט / חסום)
        clearTimeout(timer);
        script.remove(); // מסירים כדי שניסיון הבא יוסיף מחדש
        fail();
      };
      document.head.appendChild(script); // הוספה לדף = התחלת ההורדה
    }
  });
  return apiPromise;
}

const YouTubePlayer = forwardRef(function YouTubePlayer({ videoId }, ref) { // videoId = 11 התווים של הסרטון
  const hostRef = useRef(null); // האלמנט שבתוכו נשים את הנגן
  const playerRef = useRef(null); // אובייקט הנגן של YouTube
  const [state, setState] = useState("loading"); // loading | ready | error

  // מה שדף ההורה מקבל דרך ה-ref
  useImperativeHandle(
    ref,
    () => ({
      getPosition() {
        const player = playerRef.current;
        if (!player?.getCurrentTime) return 0; // הנגן עוד לא מוכן
        return Math.round(player.getCurrentTime() * 10) / 10; // הזמן בשניות, עם ספרה אחת אחרי הנקודה
      },
      seekBy(seconds) { // קפיצה קדימה/אחורה (למשל -15)
        const player = playerRef.current;
        if (!player?.seekTo) return;
        player.seekTo(Math.max(0, player.getCurrentTime() + seconds), true); // לא פחות מ-0; true = לטעון מהשרת אם צריך
      },
    }),
    [],
  );

  // יוצר את הנגן, ויוצר אותו מחדש כשה-videoId משתנה
  useEffect(() => {
    let cancelled = false; // הופך ל-true כשהרכיב מוסר, כדי לא לעדכן state אחר כך
    setState("loading");
    // הסקריפט יכול להיטען בזמן שה-iframe עצמו חסום (סינון רשת או תוסף); אז onReady לא יגיע לעולם,
    // ולכן "טוען..." לא יכול להישאר לנצח
    const readyTimer = setTimeout(() => {
      if (!cancelled) setState("error");
    }, READY_TIMEOUT_MS);
    // YT.Player מחליף את האלמנט שהוא מקבל, ולכן יוצרים div ידני ו-React שולט רק בהורה
    const target = document.createElement("div");
    hostRef.current.appendChild(target);

    loadYouTubeApi()
      .then((YT) => { // הסקריפט מוכן
        if (cancelled) return;
        playerRef.current = new YT.Player(target, { // יצירת הנגן
          videoId,
          width: "100%",
          height: "100%",
          // rel: 0 – סרטונים מוצעים רק מאותו ערוץ; origin – לאבטחת התקשורת עם ה-iframe
          playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
          events: {
            onReady: () => { // הנגן מוכן לניגון
              clearTimeout(readyTimer);
              if (!cancelled) setState("ready");
            },
          },
        });
      })
      .catch(() => { // הסקריפט לא נטען
        clearTimeout(readyTimer);
        if (!cancelled) setState("error");
      });

    return () => { // ניקוי: רץ כשהרכיב מוסר או לפני יצירת נגן לסרטון אחר
      cancelled = true;
      clearTimeout(readyTimer);
      playerRef.current?.destroy?.(); // הריסת הנגן (אם קיים ואם יש לו destroy)
      playerRef.current = null;
      target.remove(); // הסרת ה-div מהדף
    };
  }, [videoId]);

  return (
    <div className="video-frame">
      {/* כאן הנגן ייכנס */}
      <div ref={hostRef} className="video-host" />
      {state === "loading" && <p className="video-message">טוען את הסרטון...</p>}
      {state === "error" && (
        <p className="video-message" role="alert">
          לא ניתן לטעון את הנגן. בדקו את החיבור לאינטרנט.
        </p>
      )}
    </div>
  );
});

export default YouTubePlayer;
