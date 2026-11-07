import { useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { register } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { checkPassword, PASSWORD_HINT } from "../auth/passwordRules.js";
import Field from "../components/Field.jsx";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const refs = { email: useRef(null), password: useRef(null), display_name: useRef(null) };

  if (user) return <Navigate to="/library" replace />;

  const update = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  function showErrors(next) {
    setErrors(next);
    const first = ["email", "password", "display_name"].find((name) => next[name]);
    if (first) refs[first].current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.email.trim()) next.email = "נא למלא אימייל";
    next.password = form.password ? checkPassword(form.password) : "נא למלא סיסמה";
    if (!form.display_name.trim()) next.display_name = "נא למלא שם תצוגה";
    if (Object.values(next).some(Boolean)) {
      showErrors(next);
      return;
    }

    setSending(true);
    setErrors({});
    try {
      await register({ ...form, email: form.email.trim() });
      navigate("/login?registered=1");
    } catch (error) {
      if (error.status === 409) {
        showErrors({ email: error.message });
      } else if (error.status === 422) {
        const text = error.message;
        if (text.includes("אימייל") && !text.includes("סיסמה")) showErrors({ email: text });
        else if (text.includes("שם התצוגה")) showErrors({ display_name: text });
        else showErrors({ password: text });
      } else {
        showErrors({ form: error.message });
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
