import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <strong className="brand">FocusFlow</strong>
          <nav aria-label="ניווט ראשי" className="site-nav">
            <NavLink to="/library">הספרייה שלי</NavLink>
            <NavLink to="/history">היסטוריה</NavLink>
            <NavLink to="/profile">פרופיל</NavLink>
          </nav>
          <span className="site-user">שלום, {user?.display_name}</span>
          <button type="button" className="btn" onClick={handleLogout} disabled={leaving}>
            {leaving ? "מתנתק..." : "התנתקות"}
          </button>
        </div>
      </header>
      <Outlet />
    </>
  );
}
