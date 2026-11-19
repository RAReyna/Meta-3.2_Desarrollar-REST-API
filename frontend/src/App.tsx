import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import RutaAdmin from "./components/RutaAdmin";
import Login from "./pages/Login";
import Jugadores from "./pages/admin/Jugadores";
import Rosters from "./pages/admin/Rosters";
import RosterDetalle from "./pages/admin/RosterDetalle";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/admin/jugadores" replace />} />
        <Route path="login" element={<Login />} />
        <Route element={<RutaAdmin />}>
          <Route path="admin/jugadores" element={<Jugadores />} />
          <Route path="admin/rosters" element={<Rosters />} />
          <Route path="admin/rosters/:id" element={<RosterDetalle />} />
        </Route>
      </Route>
    </Routes>
  );
}
