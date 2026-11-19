import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RutaProtegida from "./components/RutaProtegida";
import { destinoPorRol, useAuth } from "./auth";
import Login from "./pages/Login";
import JugadoresPublic from "./pages/public/Jugadores";
import Jugadores from "./pages/admin/Jugadores";
import Rosters from "./pages/admin/Rosters";
import RosterDetalle from "./pages/admin/RosterDetalle";

export default function App() {
  const { usuario, cargando } = useAuth();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            cargando ? null : <Navigate to={destinoPorRol(usuario)} replace />
          }
        />
        <Route path="login" element={<Login />} />
        <Route element={<RutaProtegida />}>
          <Route path="jugadores" element={<JugadoresPublic />} />
        </Route>
        <Route element={<RutaProtegida rol="admin" />}>
          <Route path="admin/jugadores" element={<Jugadores />} />
          <Route path="admin/rosters" element={<Rosters />} />
          <Route path="admin/rosters/:id" element={<RosterDetalle />} />
        </Route>
      </Route>
    </Routes>
  );
}
