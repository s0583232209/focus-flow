// דף הספרייה: טופס הוספת פריט (סרטון או טקסט) ורשת כרטיסים של כל הפריטים.
import { useCallback, useEffect, useState } from "react"; // hooks של React
import { Link } from "react-router-dom"; // קישור פנימי
import { createContent, deleteContent, listContent } from "../api/client.js"; // קריאות לשרת
import Field from "../components/Field.jsx"; // שדה טופס

const MIN_TEXT = 20; // אורך מינימלי לטקסט (כמו בשרת)
const EMPTY_FORM = { title: "", type: "youtube", url: "", text: "" }; // ערכי ההתחלה של הטופס

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("he-IL"); // תאריך בפורמט ישראלי
}

// ── טופס הוספת פריט ──
// onAdded = פונקציה מהדף, נקראת עם הפריט החדש כדי להוסיף אותו לרשימה בלי לטעון מחדש
function AddItemForm({ onAdded }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false); // להצגת "הפריט נוסף לספרייה"

  // onChange לשדה לפי שם; כל שינוי מסתיר את הודעת ההצלחה הקודמת
  const set = (name) => (event) => {
    setForm({ ...form, [name]: event.target.value });
    setDone(false);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setDone(false);
    const isVideo = form.type === "youtube";
    const source = (isVideo ? form.url : form.text).trim(); // הקישור או הטקסט, לפי הסוג
    const next = {};
    if (!form.title.trim()) next.title = "נא למלא כותרת";
    if (isVideo && !source) next.url = "נא להדביק קישור לסרטון";
    if (!isVideo && source.length < MIN_TEXT) next.text = `הטקסט קצר מדי: לפחות ${MIN_TEXT} תווים`;
    setErrors(next);
    if (Object.keys(next).length > 0) return; // יש שגיאות – לא שולחים

    setSending(true);
    try {
      // השרת בודק את הקישור ומחלץ את video_id
      const item = await createContent({ title: form.title, type: form.type, source });
      setForm(EMPTY_FORM); // איפוס הטופס
      setDone(true);
      onAdded(item); // מוסיפים לרשימה
    } catch (error) {
      setErrors({ form: error.message }); // למשל "הקישור לא נראה כמו קישור תקין..." – הערכים נשארים בטופס
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card">
      <h2>הוספת פריט</h2>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="כותרת" value={form.title} onChange={set("title")} error={errors.title} />
        {/* fieldset + legend – קבוצת כפתורי רדיו עם כותרת משותפת (נגיש לקוראי מסך) */}
        <fieldset className="field radio-group">
          <legend>סוג התוכן</legend>
          <label>
            {/* אותו name לשני הכפתורים = אפשר לבחור רק אחד */}
            <input
              type="radio"
              name="content-type"
              value="youtube"
              checked={form.type === "youtube"}
              onChange={set("type")}
            />
            סרטון YouTube
          </label>
          <label>
            <input
              type="radio"
              name="content-type"
              value="text"
              checked={form.type === "text"}
              onChange={set("type")}
            />
            טקסט לקריאה
          </label>
        </fieldset>
        {/* לפי הסוג: שדה קישור או תיבת טקסט */}
        {form.type === "youtube" ? (
          <Field
            label="קישור לסרטון"
            type="url"
            dir="ltr"
            placeholder="https://www.youtube.com/watch?v=..."
            value={form.url}
            onChange={set("url")}
            error={errors.url}
          />
        ) : (
          <div className="field">
            <label htmlFor="content-text">הטקסט</label>
            <textarea
              id="content-text"
              rows={6}
              value={form.text}
              onChange={set("text")}
              aria-invalid={errors.text ? "true" : undefined}
            />
            {/* מונה תווים שמתעדכן בזמן ההקלדה */}
            <span className="hint">{form.text.trim().length} תווים (לפחות {MIN_TEXT})</span>
            {errors.text && (
              <p className="error" role="alert">
                {errors.text}
              </p>
            )}
          </div>
        )}
        {errors.form && (
          <p className="notice notice-error" role="alert">
            {errors.form}
          </p>
        )}
        {done && (
          <p className="notice notice-success" role="status">
            הפריט נוסף לספרייה
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "מוסיף..." : "הוספה לספרייה"}
        </button>
      </form>
    </section>
  );
}

// ── כרטיס של פריט אחד ──
function ContentCard({ item, onDelete, deleting }) {
  return (
    <article className="card content-card">
      {/* סרטון: תמונה ממוזערת מ-YouTube; טקסט: 120 התווים הראשונים */}
      {item.type === "youtube" ? (
        <img
          className="content-thumb"
          src={`https://img.youtube.com/vi/${item.video_id}/mqdefault.jpg`}
          alt={item.title}
          loading="lazy"
        />
      ) : (
        <div className="content-thumb content-thumb-text">{item.source.slice(0, 120)}</div>
      )}
      {/* הכותרת מוצגת כטקסט רגיל – גם אם היא מכילה HTML, הוא לא ירוץ */}
      <h3>{item.title}</h3>
      <p className="muted">
        {item.type === "youtube" ? "סרטון" : "טקסט"} · {formatDate(item.created_at)}
      </p>
      <div className="button-row">
        <Link className="btn btn-primary" to={`/content/${item.id}`}>
          פתיחה וצפייה
        </Link>
        <button type="button" className="btn" onClick={() => onDelete(item)} disabled={deleting}>
          {deleting ? "מוחק..." : "מחיקה"}
        </button>
      </div>
    </article>
  );
}

// ── הדף עצמו ──
export default function Library() {
  const [items, setItems] = useState(null); // null = טוען; מערך = הפריטים
  const [loadError, setLoadError] = useState(""); // שגיאה בטעינת הרשימה
  const [notice, setNotice] = useState(null); // הודעה אחרי פעולה: { kind, text }
  const [deletingId, setDeletingId] = useState(null); // איזה פריט נמחק כרגע

  const load = useCallback(async () => {
    setLoadError("");
    setItems(null);
    try {
      setItems(await listContent());
    } catch (error) {
      setLoadError(error.message);
    }
  }, []);

  useEffect(() => {
    load(); // טעינה כשהדף נפתח
  }, [load]);

  async function handleDelete(item) {
    // אישור לפני מחיקה, עם שם הפריט
    if (!window.confirm(`למחוק את "${item.title}"? הפעולה לא ניתנת לביטול`)) return;
    setNotice(null);
    setDeletingId(item.id);
    try {
      await deleteContent(item.id);
      // מסירים את הפריט מהרשימה המקומית (filter יוצר מערך חדש בלעדיו)
      setItems((current) => current.filter((other) => other.id !== item.id));
      setNotice({ kind: "success", text: "הפריט נמחק" });
    } catch (error) {
      setNotice({ kind: "error", text: error.message });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="container">
      <h1>הספרייה שלי</h1>
      {/* פריט חדש נוסף לתחילת הרשימה (החדש ראשון, כמו בשרת) */}
      <AddItemForm
        onAdded={(item) => {
          setNotice(null);
          setItems((current) => [item, ...(current ?? [])]);
        }}
      />
      {notice && (
        <p
          className={`notice notice-${notice.kind}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}
      {loadError && (
        <div className="notice notice-error" role="alert">
          <p>{loadError}</p>
          <button type="button" className="btn" onClick={load}>
            נסו שוב
          </button>
        </div>
      )}
      {!loadError && items === null && <p>טוען את הספרייה...</p>}
      {items?.length === 0 && <p>הספרייה ריקה. הוסיפו סרטון או טקסט כדי להתחיל.</p>}
      {items?.length > 0 && (
        <div className="content-grid">
          {/* key ייחודי לכל כרטיס – מזהה הפריט */}
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
              deleting={deletingId === item.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
