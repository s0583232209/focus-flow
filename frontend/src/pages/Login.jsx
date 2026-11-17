// דף ההתחברות.
import { useRef, useState } from "react"; // hooks של React
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom"; // ניווט וקריאת פרמטרים מהכתובת (?expired=1)
import { useAuth } from "../auth/AuthContext.jsx"; // פעולת login
import Field from "../components/Field.jsx"; // שדה טופס עם תווית ושגיאה

// הודעות שמוצגות לפי פרמטר בכתובת, למשל /login?registered=1
const BANNERS = {
  registered: "נרשמתם בהצלחה, אפשר להתחבר",
  expired: "פג תוקף ההתחברות, התחברו שוב",
  pwchanged: "הסיסמה הוחלפה. התחברו עם הסיסמה החדשה",
};

const PASSWORD_REQUIRED = "נא למלא סיסמה";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // הפרמטרים שאחרי ה-? בכתובת
  const [email, setEmail] = useState(""); // ערך שדה האימייל
  const [password, setPassword] = useState(""); // ערך שדה הסיסמה
  const [fieldErrors, setFieldErrors] = useState({}); // שגיאות לפי שדה
  const [formError, setFormError] = useState(""); // שגיאה כללית מהשרת
  const [sending, setSending] = useState(false); // בזמן שליחה
  const emailRef = useRef(null); // כדי להעביר פוקוס לשדה עם שגיאה
  const passwordRef = useRef(null);

  if (user) return <Navigate to="/library" replace />; // כבר מחובר – אין מה לעשות כאן

  // מוצאים איזה מהפרמטרים קיים בכתובת (אם בכלל)
  const bannerKey = Object.keys(BANNERS).find((key) => searchParams.get(key));

  async function handleSubmit(event) {
    event.preventDefault(); // מונע מהדפדפן לשלוח את הטופס ולטעון את הדף מחדש
    const next = {}; // שגיאות חדשות
    if (!email.trim()) next.email = "נא למלא אימייל";
    if (!password) next.password = PASSWORD_REQUIRED;
    setFieldErrors(next);
    setFormError("");
    if (next.email) { // פוקוס לשדה השגוי הראשון, ולא שולחים
      emailRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    setSending(true); // הכפתור מושבת ומציג "מתחבר..."
    try {
      await login({ email: email.trim(), password });
      navigate("/library", { replace: true }); // הצלחה – לספרייה
    } catch (error) {
      setFormError(error.message); // ההודעה בעברית (למשל "אימייל או סיסמה שגויים" או הודעת 429)
      setSending(false);
    }
  }

  return (
    <main className="container narrow">
      <h1>התחברות</h1>
      {bannerKey && (
        <p className="notice notice-success" role="status">
          {BANNERS[bannerKey]}
        </p>
      )}
      {/* noValidate – מבטל את בדיקות הדפדפן המובנות, כדי שההודעות שלנו בעברית יוצגו */}
      <form onSubmit={handleSubmit} noValidate>
        {/* dir="ltr" – אימייל וסיסמה נכתבים משמאל לימין */}
        <Field
          ref={emailRef}
          label="אימייל"
          type="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />
        <Field
          ref={passwordRef}
          label="סיסמה"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />
        {formError && (
          <p className="notice notice-error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "מתחבר..." : "כניסה"}
        </button>
      </form>
      <p>
        <Link to="/register">אין לכם חשבון? הרשמה</Link>
      </p>
    </main>
  );
}
