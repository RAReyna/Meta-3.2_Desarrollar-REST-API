import { Navigate, Outlet } from "react-router-dom";
import { destinoPorRol, useAuth } from "../auth";

// Sin `rol` basta con tener sesión; con `rol` además exige ese rol.
export default function RutaProtegida({ rol }: { rol?: "admin" }) {
  const { usuario, cargando } = useAuth();
  if (cargando) return <p>Cargando…</p>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) {
    return <Navigate to={destinoPorRol(usuario)} replace />;
  }
  return <Outlet />;
}
