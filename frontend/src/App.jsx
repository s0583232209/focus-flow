import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";
import History from "./pages/History.jsx";
import Library from "./pages/Library.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import SessionDetail from "./pages/SessionDetail.jsx";
import Watch from "./pages/Watch.jsx";

// Dev-only measurement page; left out of the production build.
const Lab = import.meta.env.DEV ? lazy(() => import("./pages/Lab.jsx")) : null;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/library" element={<Library />} />
              <Route path="/content/:id" element={<Watch />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<SessionDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
          {Lab && (
            <Route
              path="/lab"
              element={
                <Suspense fallback={<p>טוען...</p>}>
                  <Lab />
                </Suspense>
              }
            />
          )}
          <Route path="/" element={<Navigate to="/library" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
