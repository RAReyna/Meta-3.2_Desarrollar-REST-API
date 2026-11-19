import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api";
import { destinoPorRol, useAuth } from "../auth";
import { textoError } from "../errores";

// Registro abierto: el backend crea la cuenta con rol public.
export default function Registro() {
  const { usuario, registro } = useAuth();
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
      navigate(destinoPorRol(await registro(email, password)));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Ese email ya está registrado"
          : textoError(err),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="form-login">
      <h1>Crear cuenta</h1>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="registro-email"
          required
        />
      </label>
      <label>
        Contraseña (8 a 72 caracteres)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          maxLength={72}
          data-testid="registro-password"
          required
        />
      </label>
      {error && (
        <p className="error" data-testid="registro-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={enviando} data-testid="registro-submit">
        Crear cuenta
      </button>
    </form>
  );
}
