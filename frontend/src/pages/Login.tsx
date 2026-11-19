import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../api";
import { useAuth } from "../auth";

const ERRORES_GOOGLE: Record<string, string> = {
  google_denegado: "Cancelaste el acceso con Google",
  state_invalido: "La sesión de Google expiró, intenta de nuevo",
  sin_codigo: "Google no devolvió un código válido",
  token_fallido: "No se pudo validar con Google",
  perfil_fallido: "No se pudo leer tu perfil de Google",
  email_no_verificado: "Tu email de Google no está verificado",
  error_interno: "Error interno al iniciar sesión con Google",
};

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    ERRORES_GOOGLE[params.get("error") ?? ""] ?? "",
  );
  const [enviando, setEnviando] = useState(false);

  if (usuario?.rol === "admin") {
    return <Navigate to="/admin/jugadores" replace />;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await login(email, password);
      navigate("/admin/jugadores");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Email o contraseña incorrectos"
          : "No se pudo iniciar sesión",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="form-login">
      <h1>Iniciar sesión</h1>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="login-email"
          required
        />
      </label>
      <label>
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="login-password"
          required
        />
      </label>
      {error && (
        <p className="error" data-testid="login-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} data-testid="login-submit">
        Entrar
      </button>
      <button
        type="button"
        onClick={() => window.location.assign("/api/v1/auth/google/login")}
        data-testid="login-google"
      >
        Entrar con Google
      </button>
    </form>
  );
}
