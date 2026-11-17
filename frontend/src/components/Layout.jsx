// מסגרת הדפים המוגנים: סרגל עליון (ניווט, שם המשתמש, התנתקות) ומתחתיו הדף עצמו.
import { useState } from "react"; // state מקומי
import { NavLink, Outlet, useNavigate } from "react-router-dom"; // NavLink = קישור שיודע אם הוא פעיל; Outlet = מקום הדף; useNavigate = מעבר דף בקוד
import { useAuth } from "../auth/AuthContext.jsx"; // המשתמש ופעולת ההתנתקות

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false); // true בזמן ההתנתקות – להצגת "מתנתק..."

  async function handleLogout() {
    setLeaving(true); // הכפתור מושבת ומציג "מתנתק..."
    await logout(); // השרת מבטל את הטוקן, והטוקן נמחק מהדפדפן
    navigate("/login", { replace: true }); // replace: כפתור "אחורה" לא יחזיר לדף המוגן
  }

  return (
    // <> ... </> = Fragment: עוטף כמה אלמנטים בלי להוסיף div מיותר לדף
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <strong className="brand">FocusFlow</strong>
          {/* aria-label נותן שם לאזור הניווט לקוראי מסך */}
          <nav aria-label="ניווט ראשי" className="site-nav">
            {/* NavLink מוסיף אוטומטית class="active" לקישור של הדף הנוכחי – ב-CSS הוא מודגש */}
            <NavLink to="/library">הספרייה שלי</NavLink>
            <NavLink to="/history">היסטוריה</NavLink>
            <NavLink to="/profile">פרופיל</NavLink>
          </nav>
          {/* user?.display_name – אם user הוא null לא תהיה שגיאה */}
          <span className="site-user">שלום, {user?.display_name}</span>
          <button type="button" className="btn" onClick={handleLogout} disabled={leaving}>
            {leaving ? "מתנתק..." : "התנתקות"}
          </button>
        </div>
      </header>
      {/* כאן מוצג הדף שהתאים לכתובת (ספרייה, היסטוריה וכו') */}
      <Outlet />
    </>
  );
}
