import { forwardRef, useId } from "react"; // forwardRef מאפשר להעביר ref לאלמנט ה-input; useId יוצר מזהה ייחודי

// שדה טופס עם תווית (label), רמז אופציונלי והודעת שגיאה ממש מתחתיו.
// ...inputProps = כל שאר ה-props (type, value, onChange וכו') מועברים כמו שהם ל-<input>
const Field = forwardRef(function Field({ label, error, hint, ...inputProps }, ref) {
  const id = useId(); // מזהה ייחודי לשדה, כדי לקשר את ה-label ל-input
  const errorId = `${id}-error`; // מזהה להודעת השגיאה
  const hintId = `${id}-hint`; // מזהה לרמז
  // רשימת המזהים שמתארים את השדה (לקוראי מסך). filter(Boolean) מסיר את ה-null
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ");
  return (
    <div className="field">
      {/* htmlFor מקשר את התווית לשדה: לחיצה על התווית מעבירה פוקוס לשדה */}
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        ref={ref} // ה-ref מאפשר לדף להעביר פוקוס לשדה כשיש בו שגיאה
        aria-invalid={error ? "true" : undefined} // מודיע לקורא מסך שהשדה לא תקין
        aria-describedby={describedBy || undefined} // קורא המסך יקריא גם את הרמז/השגיאה
        {...inputProps}
      />
      {/* && = מציגים רק אם יש רמז */}
      {hint && (
        <span id={hintId} className="hint">
          {hint}
        </span>
      )}
      {/* הודעת השגיאה; role="alert" גורם לקורא מסך להקריא אותה מיד */}
      {error && (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Field;
