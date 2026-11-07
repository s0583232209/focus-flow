import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="container">
      <h1>הדף לא נמצא</h1>
      <Link to="/library">חזרה לספרייה</Link>
    </main>
  );
}
