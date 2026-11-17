// דף ההרשמה.
import { useRef, useState } from "react"; // hooks של React
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"; // ניווט
import { register } from "../api/client.js"; // קריאת ההרשמה לשרת
import { useAuth } from "../auth/AuthContext.jsx"; // לבדוק אם כבר מחובר
import { checkPassword, PASSWORD_HINT } from "../auth/passwordRules.js"; // בדיקת סיסמה בדפדפן
import Field from "../components/Field.jsx"; // שדה טופס

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ?deleted=1 אחרי מחיקת חשבון
  const [form, setForm] = useState({ email: "", password: "", display_name: "" }); // כל ערכי הטופס באובייקט אחד
  const [errors, setErrors] = useState({}); // שגיאות לפי שדה (ו-form לשגיאה כללית)
  const [sending, setSending] = useState(false);
  const refs = { email: useRef(null), password: useRef(null), display_name: useRef(null) }; // ref לכל שדה, להעברת פוקוס

  if (user) return <Navigate to="/library" replace />; // מחובר – לספרייה

  // מחזירה פונקציית onChange לשדה מסוים. [name] = מפתח דינמי לפי שם השדה
  const update = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  // מציגה שגיאות ומעבירה פוקוס לשדה השגוי הראשון (לפי סדר השדות בטופס)
  function showErrors(next) {
    setErrors(next);
    const first = ["email", "password", "display_name"].find((name) => next[name]);
    if (first) refs[first].current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault(); // בלי טעינת דף מחדש
    const next = {};
    if (!form.email.trim()) next.email = "נא למלא אימייל";
    next.password = form.password ? checkPassword(form.password) : "נא למלא סיסמה"; // null אם תקינה
    if (!form.display_name.trim()) next.display_name = "נא למלא שם תצוגה";
    if (Object.values(next).some(Boolean)) { // יש לפחות שגיאה אחת – לא שולחים לשרת
      showErrors(next);
      return;
    }

    setSending(true); // "נרשם..."
    setErrors({});
    try {
      await register({ ...form, email: form.email.trim() });
      navigate("/login?registered=1"); // הצלחה – לדף ההתחברות עם הודעה
    } catch (error) {
      if (error.status === 409) { // אימייל קיים
        showErrors({ email: error.message });
      } else if (error.status === 422) { // השרת דחה ערך – מנחשים לפי הטקסט לאיזה שדה הוא שייך
        const text = error.message;
        if (text.includes("אימייל") && !text.includes("סיסמה")) showErrors({ email: text });
        else if (text.includes("שם התצוגה")) showErrors({ display_name: text });
        else showErrors({ password: text }); // ברירת מחדל: הסיסמה
      } else {
        showErrors({ form: error.message }); // שגיאה כללית (למשל השרת לא זמין)
      }
      setSending(false);
    }
  }

  return (
    <main className="container narrow">
      <h1>הרשמה</h1>
      {searchParams.get("deleted") && (
        <p className="notice notice-success" role="status">
          החשבון נמחק
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <Field
          ref={refs.email}
          label="אימייל"
          type="email"
          autoComplete="email"
          dir="ltr"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
        />
        {/* autoComplete="new-password" – הדפדפן יציע ליצור סיסמה חזקה */}
        <Field
          ref={refs.password}
          label="סיסמה"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          hint={PASSWORD_HINT}
          value={form.password}
          onChange={update("password")}
          error={errors.password}
        />
        <Field
          ref={refs.display_name}
          label="שם תצוגה"
          type="text"
          autoComplete="nickname"
          value={form.display_name}
          onChange={update("display_name")}
          error={errors.display_name}
        />
        {errors.form && (
          <p className="notice notice-error" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "נרשם..." : "הרשמה"}
        </button>
      </form>
      <p>
        <Link to="/login">כבר רשומים? להתחברות</Link>
      </p>
    </main>
  );
}
