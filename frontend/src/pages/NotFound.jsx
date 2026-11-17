// דף "הדף לא נמצא" – מוצג לכל כתובת שלא קיימת באתר.
import { Link } from "react-router-dom"; // קישור פנימי (בלי טעינה מחדש של הדף)

export default function NotFound() {
  return (
    <main className="container">
      <h1>הדף לא נמצא</h1>
      <Link to="/library">חזרה לספרייה</Link>
    </main>
  );
}
