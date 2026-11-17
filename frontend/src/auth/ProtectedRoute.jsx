// שומר על דפים שדורשים התחברות: מחובר → מציג את הדף; לא מחובר → מעביר ל-/login.
import { Navigate, Outlet } from "react-router-dom"; // Navigate = מעבר לדף אחר; Outlet = "כאן יוצג הדף הפנימי"
import { useAuth } from "./AuthContext.jsx"; // מצב ההתחברות

export default function ProtectedRoute() {
  const { user, loading } = useAuth(); // מי מחובר, והאם עוד בודקים
  if (loading) { // עוד לא יודעים אם מחובר – לא מחליטים מוקדם מדי
    return (
      <main className="container">
        <p>טוען...</p>
      </main>
    );
  }
  // מחובר → מציגים את הנתיב הפנימי שהתאים (Outlet). לא מחובר → מעבר לדף ההתחברות
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
