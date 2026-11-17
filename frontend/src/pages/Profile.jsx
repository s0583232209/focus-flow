// דף הפרופיל: פרטי החשבון, שינוי שם, החלפת סיסמה ומחיקת חשבון.
// כל חלק הוא רכיב קטן נפרד עם state משלו.
import { useRef, useState } from "react"; // hooks של React
import { useNavigate } from "react-router-dom"; // מעבר דף בקוד
import { changePassword, deleteMe, updateMe } from "../api/client.js"; // קריאות לשרת
import { useAuth } from "../auth/AuthContext.jsx"; // המשתמש ופעולות ההתחברות
import { checkPassword, PASSWORD_HINT } from "../auth/passwordRules.js"; // כללי סיסמה
import Field from "../components/Field.jsx"; // שדה טופס
import { formatDate } from "../components/format.js"; // עיצוב תאריך

const DELETE_WORD = "מחיקה"; // המילה שצריך להקליד כדי לאשר מחיקת חשבון

// ── שינוי שם תצוגה ──
function NameForm() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.display_name); // מתחילים מהשם הנוכחי
  const [error, setError] = useState("");
  const [done, setDone] = useState(false); // להצגת "השם עודכן"
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setDone(false);
    if (!name.trim()) { // שם ריק
      setError("נא למלא שם תצוגה");
      return;
    }
    setError("");
    setSending(true);
    try {
      await updateMe({ display_name: name }); // שמירה בשרת
      await refreshUser(); // טעינת המשתמש מחדש – כך השם בסרגל העליון מתעדכן מיד
      setDone(true);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSending(false); // finally רץ גם בהצלחה וגם בשגיאה
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

// ── החלפת סיסמה ──
function PasswordForm() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" }); // שלושת השדות
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const currentRef = useRef(null); // לפוקוס על "סיסמה נוכחית" כשהיא שגויה

  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value }); // onChange לשדה לפי שם

  async function handleSubmit(event) {
    event.preventDefault();
    const found = {}; // שגיאות שנמצאו בבדיקה בדפדפן
    if (!form.current) found.current = "נא למלא את הסיסמה הנוכחית";
    const weak = checkPassword(form.next); // אותם כללים כמו בהרשמה
    if (weak) found.next = weak;
    if (form.next !== form.confirm) found.confirm = "הסיסמאות לא תואמות"; // האימות חייב להיות זהה
    setErrors(found);
    if (Object.keys(found).length > 0) return; // יש שגיאות – לא שולחים

    setSending(true);
    try {
      await changePassword({ current_password: form.current, new_password: form.next });
      // השרת ביטל את כל הטוקנים הישנים, כולל זה שלנו – לכן מנתקים ומבקשים להתחבר מחדש
      clearSession();
      navigate("/login?pwchanged=1", { replace: true });
    } catch (cause) {
      if (cause.status === 400) { // הסיסמה הנוכחית שגויה
        setErrors({ current: cause.message });
        currentRef.current?.focus();
      } else if (cause.status === 422) { // השרת דחה את הסיסמה החדשה
        setErrors({ next: cause.message });
      } else {
        setErrors({ form: cause.message }); // שגיאה כללית
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

// ── מחיקת חשבון ("אזור מסוכן") ──
function DeleteAccount() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [word, setWord] = useState(""); // מה שהמשתמש הקליד בשדה האישור
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleDelete() {
    // אישור שני: חלון של הדפדפן. "ביטול" מחזיר false ואז יוצאים
    if (!window.confirm("למחוק את החשבון וכל הנתונים? הפעולה לא ניתנת לביטול")) return;
    setError("");
    setSending(true);
    try {
      await deleteMe(); // השרת מוחק את המשתמש ואת כל הנתונים שלו
      clearSession(); // מנקים את הטוקן מהדפדפן
      navigate("/register?deleted=1", { replace: true }); // לדף ההרשמה עם "החשבון נמחק"
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
      {/* הכפתור פעיל רק כשהוקלדה בדיוק המילה "מחיקה" ולא באמצע שליחה */}
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

// הדף עצמו: פרטי החשבון ושלושת החלקים
export default function Profile() {
  const { user } = useAuth();
  return (
    <main className="container">
      <h1>הפרופיל שלי</h1>
      <section className="card">
        <p>
          {/* האימייל משמאל לימין גם בתוך טקסט עברי */}
          אימייל: <span dir="ltr">{user.email}</span>
        </p>
        {/* created_at יכול לחסר אם השרת לא היה זמין בטעינה */}
        <p>חבר מאז {user.created_at ? formatDate(user.created_at) : "—"}</p>
      </section>
      <NameForm />
      <PasswordForm />
      <DeleteAccount />
    </main>
  );
}
