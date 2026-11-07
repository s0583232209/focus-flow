import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Field from "../components/Field.jsx";

const BANNERS = {
  registered: "נרשמתם בהצלחה, אפשר להתחבר",
  expired: "פג תוקף ההתחברות, התחברו שוב",
  pwchanged: "הסיסמה הוחלפה. התחברו עם הסיסמה החדשה",
};

const PASSWORD_REQUIRED = "נא למלא סיסמה";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [sending, setSending] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  if (user) return <Navigate to="/library" replace />;

  const bannerKey = Object.keys(BANNERS).find((key) => searchParams.get(key));

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!email.trim()) next.email = "נא למלא אימייל";
    if (!password) next.password = PASSWORD_REQUIRED;
    setFieldErrors(next);
    setFormError("");
    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return;
    }

    setSending(true);
    try {
      await login({ email: email.trim(), password });
      navigate("/library", { replace: true });
    } catch (error) {
      setFormError(error.message);
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
      <form onSubmit={handleSubmit} noValidate>
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
