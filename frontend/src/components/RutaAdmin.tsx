import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth";

export default function RutaAdmin() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <p>Cargando…</p>;
  if (!usuario || usuario.rol !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
