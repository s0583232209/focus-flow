// הרכיב הראשי: מגדיר את כל הנתיבים (דפים) של האתר ואיזה רכיב מוצג בכל כתובת.
import { lazy, Suspense } from "react"; // lazy טוען רכיב רק כשצריך; Suspense מציג משהו בזמן הטעינה
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"; // ניווט בין דפים בלי לטעון את האתר מחדש
import { AuthProvider } from "./auth/AuthContext.jsx"; // מחזיק את מצב ההתחברות לכל האפליקציה
import ProtectedRoute from "./auth/ProtectedRoute.jsx"; // שומר על דפים שדורשים התחברות
import Layout from "./components/Layout.jsx"; // מסגרת הדף: סרגל עליון + תוכן
import History from "./pages/History.jsx"; // דף ההיסטוריה
import Library from "./pages/Library.jsx"; // דף הספרייה
import Login from "./pages/Login.jsx"; // דף ההתחברות
import NotFound from "./pages/NotFound.jsx"; // דף "לא נמצא"
import Profile from "./pages/Profile.jsx"; // דף הפרופיל
import Register from "./pages/Register.jsx"; // דף ההרשמה
import SessionDetail from "./pages/SessionDetail.jsx"; // פרטי סשן
import Watch from "./pages/Watch.jsx"; // דף הצפייה

// דף הניסוי /lab קיים רק בזמן פיתוח (npm run dev). בבנייה לייצור DEV הוא false, והקוד שלו לא נכנס בכלל
const Lab = import.meta.env.DEV ? lazy(() => import("./pages/Lab.jsx")) : null;

export default function App() {
  return (
    // BrowserRouter מאפשר ניווט לפי הכתובת בשורת הדפדפן
    <BrowserRouter>
      {/* AuthProvider עוטף הכל, כדי שכל דף יוכל לדעת מי המשתמש המחובר */}
      <AuthProvider>
        {/* Routes בוחר את ה-Route הראשון שמתאים לכתובת הנוכחית */}
        <Routes>
          {/* דפים ציבוריים – בלי התחברות */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* כל מה שבפנים מוגן: משתמש לא מחובר יועבר ל-/login */}
          <Route element={<ProtectedRoute />}>
            {/* כל הדפים המוגנים מוצגים בתוך ה-Layout (עם הסרגל העליון) */}
            <Route element={<Layout />}>
              <Route path="/library" element={<Library />} />
              {/* :id הוא פרמטר – הדף קורא אותו עם useParams */}
              <Route path="/content/:id" element={<Watch />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<SessionDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          {/* הנתיב /lab נוסף רק אם Lab קיים (בפיתוח בלבד) */}
          {Lab && (
            <Route
              path="/lab"
              element={
                // בזמן שקוד הדף נטען מוצג "טוען..."
                <Suspense fallback={<p>טוען...</p>}>
                  <Lab />
                </Suspense>
              }
            />
          )}
          {/* הכתובת הראשית מפנה לספרייה. replace = לא מוסיף רשומה להיסטוריית הדפדפן */}
          <Route path="/" element={<Navigate to="/library" replace />} />
          {/* * = כל כתובת אחרת שלא התאימה → "הדף לא נמצא" */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
