// "הקשר" (Context) של ההתחברות: מחזיק את המשתמש המחובר ונותן לכל רכיב באפליקציה
// גישה אליו ולפעולות login / logout, בלי להעביר props דרך כל הרכיבים.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"; // hooks של React
import * as api from "../api/client.js"; // כל פונקציות ה-API תחת השם api

const AuthContext = createContext(null); // יצירת ה-Context (הערך האמיתי ניתן ב-Provider למטה)

const RETRY_MS = 5000; // כל כמה זמן לנסות שוב כשהשרת לא זמין (5 שניות)

export function AuthProvider({ children }) { // children = כל מה שעטוף בתוך <AuthProvider>
  const [user, setUser] = useState(null); // המשתמש המחובר, או null אם אין
  const [loading, setLoading] = useState(true); // true בזמן הבדיקה הראשונית בטעינת הדף
  // השרת לא היה זמין בטעינה. הטוקן אולי עדיין תקין, אז המשתמש נשאר בדף
  // (הדפים מציגים "נסו שוב" משלהם) ואנחנו ממשיכים לבדוק בשקט ברקע
  const [unverified, setUnverified] = useState(false);

  // useCallback שומר את אותה פונקציה בין רינדורים, כדי ש-useEffect שתלוי בה לא ירוץ סתם שוב
  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe(); // שואלים את השרת מי מחובר
      setUser(me); // שומרים
      setUnverified(false);
      return me;
    } catch (error) {
      if (error.status === 0) { // אין חיבור לשרת (לא שגיאת הרשאה)
        // משאירים את המשתמש הקיים, או משתמש "זמני" בלי שם – כדי לא לזרוק אותו החוצה
        setUser((current) => current ?? { display_name: "" });
        setUnverified(true); // מסמנים שצריך לבדוק שוב
        return null;
      }
      setUser(null); // כל שגיאה אחרת (למשל 401) – לא מחובר
      setUnverified(false);
      throw error; // מעבירים את השגיאה הלאה למי שקרא
    }
  }, []); // [] = הפונקציה נוצרת פעם אחת

  // רץ פעם אחת כשהאפליקציה עולה: בודק אם יש טוקן שמור ותקף
  useEffect(() => {
    let active = true; // מונע עדכון state אחרי שהרכיב כבר הוסר
    (async () => { // פונקציה אסינכרונית שמופעלת מיד (useEffect עצמו לא יכול להיות async)
      if (api.hasValidToken()) { // יש טוקן שלא פג
        try {
          await refreshUser(); // מוודאים מול השרת שהוא באמת תקף – זה מה שגורם לרענון לא לנתק
        } catch {
          // לא מחובר. במקרה של 401 לקוח ה-API כבר מעביר לדף ההתחברות
        }
      } else {
        api.clearToken(); // טוקן שפג (או חסר) – מנקים
      }
      if (active) setLoading(false); // סיימנו לבדוק
    })();
    return () => { // פונקציית ניקוי – רצה כשהרכיב מוסר
      active = false;
    };
  }, [refreshUser]);

  // כשהשרת לא היה זמין: מנסים שוב כל 5 שניות עד שהוא חוזר
  useEffect(() => {
    if (!unverified) return undefined; // אין צורך – לא מפעילים טיימר
    const timer = setInterval(() => {
      refreshUser().catch(() => {}); // מתעלמים משגיאות; ננסה שוב בפעם הבאה
    }, RETRY_MS);
    return () => clearInterval(timer); // עצירת הטיימר כשהמצב משתנה או כשהרכיב מוסר
  }, [unverified, refreshUser]);

  const login = useCallback(
    async (credentials) => {
      await api.login(credentials); // שולח אימייל וסיסמה ושומר את הטוקן
      return refreshUser(); // טוען את פרטי המשתמש
    },
    [refreshUser],
  );

  // שוכחים את המשתמש מקומית בלי לפנות לשרת (הטוקן כבר מת או לא קיים)
  const clearSession = useCallback(() => {
    api.clearToken();
    setUser(null);
    setUnverified(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout(); // מבקשים מהשרת לבטל את הטוקן
    } catch {
      // גם אם השרת כבוי – המשתמש ביקש לצאת, אז ממשיכים
    }
    clearSession(); // ומנקים מקומית
  }, [clearSession]);

  // useMemo יוצר את האובייקט מחדש רק כשאחד הערכים משתנה – כך רכיבים לא מתרנדרים סתם
  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, clearSession }),
    [user, loading, login, logout, refreshUser, clearSession],
  );

  // כל רכיב בתוך ה-Provider יכול לקבל את value עם useAuth()
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// hook קצר לשימוש ברכיבים: const { user, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
