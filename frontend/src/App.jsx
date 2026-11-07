import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Register from "./pages/Register.jsx";

function Placeholder({ title }) {
  return (
    <main className="container">
      <h1>{title}</h1>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/library" element={<Placeholder title="הספרייה שלי" />} />
              <Route path="/content/:id" element={<Placeholder title="צפייה" />} />
              <Route path="/history" element={<Placeholder title="היסטוריית סשנים" />} />
              <Route path="/history/:id" element={<Placeholder title="פרטי סשן" />} />
              <Route path="/profile" element={<Placeholder title="הפרופיל שלי" />} />
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
