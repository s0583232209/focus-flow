// תצוגת טקסט לקריאה. "המיקום" של מדידה בטקסט הוא אחוז הגלילה (0–100).
// הרכיב חושף את אותו ממשק כמו נגן הסרטונים (getPosition, seekBy), כך שדף הצפייה לא צריך לדעת מה מוצג.
import { forwardRef, useImperativeHandle, useRef, useState } from "react"; // hooks של React

// מחשבת כמה אחוזים מהטקסט כבר נגללו
function scrollPercent(element) {
  if (!element) return 0; // האלמנט עוד לא קיים
  const range = element.scrollHeight - element.clientHeight; // כמה פיקסלים אפשר לגלול בסך הכל (גובה התוכן פחות הגובה הנראה)
  if (range <= 0) return 0; // הטקסט קצר ואין גלילה
  return Math.round((element.scrollTop / range) * 1000) / 10; // אחוז עם ספרה אחת אחרי הנקודה (למשל 42.7)
}

// forwardRef: מאפשר לדף ההורה לקבל ref לרכיב ולקרוא לפונקציות שלו
const TextReader = forwardRef(function TextReader({ text }, ref) {
  const panelRef = useRef(null); // הפניה לאלמנט הגלילה ב-DOM
  const [percent, setPercent] = useState(0); // אחוז הגלילה – לפס ההתקדמות

  // מגדיר מה ההורה מקבל דרך ה-ref: שתי פונקציות
  useImperativeHandle(
    ref,
    () => ({
      getPosition: () => scrollPercent(panelRef.current), // המיקום הנוכחי = אחוז הגלילה
      seekBy(seconds) { // "חזרה אחורה": בטקסט – גלילה למעלה בגובה מסך אחד
        const panel = panelRef.current;
        if (panel && seconds < 0) panel.scrollBy({ top: -panel.clientHeight, behavior: "smooth" }); // גלילה חלקה למעלה
      },
    }),
    [], // הפונקציות לא תלויות בשום ערך שמשתנה
  );

  // פיצול לפסקאות לפי שורה ריקה (\n ואחריו רווחים ו-\n נוסף); מסננים פסקאות ריקות
  const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim());

  return (
    <div className="text-reader">
      {/* פס התקדמות הקריאה בראש הטקסט */}
      <div className="reading-progress">
        <div className="reading-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      {/* tabIndex={0}: אפשר להגיע לפאנל עם Tab ולגלול אותו במקלדת */}
      <div
        ref={panelRef}
        className="text-panel"
        tabIndex={0}
        onScroll={() => setPercent(scrollPercent(panelRef.current))} // בכל גלילה – עדכון האחוז
      >
        {/* כל פסקה כטקסט רגיל ב-<p>. React מציג אותו כטקסט ולא כ-HTML, כך שאין סכנת XSS */}
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p> // key עוזר ל-React לזהות כל פריט ברשימה
        ))}
      </div>
    </div>
  );
});

export default TextReader;
