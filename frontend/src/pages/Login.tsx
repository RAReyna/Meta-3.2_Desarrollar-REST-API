import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { destinoPorRol, useAuth } from "../auth";

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destinoPorRol(usuario)} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      navigate(destinoPorRol(await login(email, password)));
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
      <p>
        ¿No tienes cuenta?{" "}
        <Link to="/registro" data-testid="link-registro">
          Regístrate
        </Link>
      </p>
    </form>
  );
}
