import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api/client.js";

const AuthContext = createContext(null);

const RETRY_MS = 5000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // The server was unreachable at load time. The token may still be fine, so the user
  // stays on the page (pages show their own "try again") and we keep checking quietly.
  const [unverified, setUnverified] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      setUnverified(false);
      return me;
    } catch (error) {
      if (error.status === 0) {
        setUser((current) => current ?? { display_name: "" });
        setUnverified(true);
        return null;
      }
      setUser(null);
      setUnverified(false);
      throw error;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (api.hasValidToken()) {
        try {
          await refreshUser();
        } catch {
          // Not signed in. A 401 already redirects in the API client.
        }
      } else {
        api.clearToken();
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (!unverified) return undefined;
    const timer = setInterval(() => {
      refreshUser().catch(() => {});
    }, RETRY_MS);
    return () => clearInterval(timer);
  }, [unverified, refreshUser]);

  const login = useCallback(
    async (credentials) => {
      await api.login(credentials);
      return refreshUser();
    },
    [refreshUser],
  );

  // Forget the user locally without asking the server (the token is already dead or gone).
  const clearSession = useCallback(() => {
    api.clearToken();
    setUser(null);
    setUnverified(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if the server is down, the user asked to leave.
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser, clearSession }),
    [user, loading, login, logout, refreshUser, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
