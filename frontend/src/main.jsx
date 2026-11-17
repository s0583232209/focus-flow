// נקודת הכניסה של אפליקציית React: מכאן הכל מתחיל לרוץ בדפדפן.
import React from "react"; // ספריית React עצמה
import { createRoot } from "react-dom/client"; // הפונקציה שמחברת את React לדף ה-HTML
import App from "./App.jsx"; // הרכיב הראשי של האפליקציה
import "./styles.css"; // העיצוב הכללי (Vite מכניס אותו לדף)

// מוצאים ב-index.html את האלמנט עם id="root" ומציירים בתוכו את האפליקציה
createRoot(document.getElementById("root")).render(
  // StrictMode מפעיל בדיקות נוספות בזמן פיתוח (למשל מריץ effects פעמיים כדי לחשוף באגים). לא משפיע בייצור
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
