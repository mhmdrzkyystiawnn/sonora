/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { LoginInput, RegisterInput, User } from "../shared/index";
import * as authApi from "../api/auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { user: nextUser, token } = await authApi.register(input);
    localStorage.setItem("token", token);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { user: nextUser, token } = await authApi.login(input);
    localStorage.setItem("token", token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return ctx;
}
