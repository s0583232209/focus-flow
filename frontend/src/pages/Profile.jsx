import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword, deleteMe, updateMe } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { checkPassword, PASSWORD_HINT } from "../auth/passwordRules.js";
import Field from "../components/Field.jsx";
import { formatDate } from "../components/format.js";

const DELETE_WORD = "מחיקה";

function NameForm() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.display_name);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setDone(false);
    if (!name.trim()) {
      setError("נא למלא שם תצוגה");
      return;
    }
    setError("");
    setSending(true);
    try {
      await updateMe({ display_name: name });
      await refreshUser();
      setDone(true);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card">
      <h2>שינוי שם תצוגה</h2>
      <form onSubmit={handleSubmit} noValidate>
        <Field
          label="שם תצוגה"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={error}
        />
        {done && (
          <p className="notice notice-success" role="status">
            השם עודכן
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "שומר..." : "שמירת השם"}
        </button>
      </form>
    </section>
  );
}

function PasswordForm() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const currentRef = useRef(null);

  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {};
    if (!form.current) found.current = "נא למלא את הסיסמה הנוכחית";
    const weak = checkPassword(form.next);
    if (weak) found.next = weak;
    if (form.next !== form.confirm) found.confirm = "הסיסמאות לא תואמות";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await changePassword({ current_password: form.current, new_password: form.next });
      // The server ended every old token, so this one is dead too.
      clearSession();
      navigate("/login?pwchanged=1", { replace: true });
    } catch (cause) {
      if (cause.status === 400) {
        setErrors({ current: cause.message });
        currentRef.current?.focus();
      } else if (cause.status === 422) {
        setErrors({ next: cause.message });
      } else {
        setErrors({ form: cause.message });
      }
      setSending(false);
    }
  }

  return (
    <section className="card">
      <h2>החלפת סיסמה</h2>
      <form onSubmit={handleSubmit} noValidate>
        <Field
          ref={currentRef}
          label="סיסמה נוכחית"
          type="password"
          autoComplete="current-password"
          dir="ltr"
          value={form.current}
          onChange={set("current")}
          error={errors.current}
        />
        <Field
          label="סיסמה חדשה"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          hint={PASSWORD_HINT}
          value={form.next}
          onChange={set("next")}
          error={errors.next}
        />
        <Field
          label="אימות סיסמה חדשה"
          type="password"
          autoComplete="new-password"
          dir="ltr"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />
        {errors.form && (
          <p className="notice notice-error" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "מחליף..." : "החלפת הסיסמה"}
        </button>
      </form>
    </section>
  );
}

function DeleteAccount() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [word, setWord] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleDelete() {
    if (!window.confirm("למחוק את החשבון וכל הנתונים? הפעולה לא ניתנת לביטול")) return;
    setError("");
    setSending(true);
    try {
      await deleteMe();
      clearSession();
      navigate("/register?deleted=1", { replace: true });
    } catch (cause) {
      setError(cause.message);
      setSending(false);
    }
  }

  return (
    <section className="card danger-zone">
      <h2>מחיקת חשבון</h2>
      <p>המחיקה תסיר את החשבון ואת כל מה ששמור בו: התוכן, הסשנים וההיסטוריה. אי אפשר לשחזר אותם.</p>
      <Field
        label={`הקלידו ${DELETE_WORD} לאישור`}
        value={word}
        onChange={(event) => setWord(event.target.value)}
      />
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn btn-danger"
        onClick={handleDelete}
        disabled={word.trim() !== DELETE_WORD || sending}
      >
        {sending ? "מוחק..." : "מחיקת החשבון וכל הנתונים"}
      </button>
    </section>
  );
}

export default function Profile() {
  const { user } = useAuth();
  return (
    <main className="container">
      <h1>הפרופיל שלי</h1>
      <section className="card">
        <p>
          אימייל: <span dir="ltr">{user.email}</span>
        </p>
        <p>חבר מאז {user.created_at ? formatDate(user.created_at) : "—"}</p>
      </section>
      <NameForm />
      <PasswordForm />
      <DeleteAccount />
    </main>
  );
}
