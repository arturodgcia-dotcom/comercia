import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { User } from "../types/domain";
import i18n from "../i18n";

const TOKEN_KEY = "comercia_access_token";

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.me(token)
      .then((loadedUser) => {
        setUser(loadedUser);
        if (loadedUser.preferred_language) {
          i18n.changeLanguage(loadedUser.preferred_language);
          localStorage.setItem("comercia_lang", loadedUser.preferred_language);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      login: async (email: string, password: string) => {
        setLoading(true);
        try {
          const auth = await api.login(email, password);
          localStorage.setItem(TOKEN_KEY, auth.access_token);
          const loadedUser = await api.me(auth.access_token);
          if (loadedUser.preferred_language) {
            i18n.changeLanguage(loadedUser.preferred_language);
            localStorage.setItem("comercia_lang", loadedUser.preferred_language);
          }
          setUser(loadedUser);
          setToken(auth.access_token);
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
          throw error;
        } finally {
          setLoading(false);
        }
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
