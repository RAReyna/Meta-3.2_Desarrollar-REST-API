import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { Usuario } from "./types";

interface AuthCtx {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al cargar la página, pregunta al backend si la cookie de sesión sigue válida.
  useEffect(() => {
    api
      .get<{ usuario: Usuario }>("/auth/me")
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(email: string, password: string) {
    const r = await api.post<{ usuario: Usuario }>("/auth/login", {
      email,
      password,
    });
    setUsuario(r.usuario);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Si la sesión ya expiró, igual limpiamos el estado local.
    }
    setUsuario(null);
  }

  return (
    <Ctx.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
