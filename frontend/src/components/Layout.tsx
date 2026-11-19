import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  async function salir() {
    await logout();
    navigate("/login");
  }

  return (
    <>
      <header className="barra">
        <strong>Rosters eSports</strong>
        <nav>
          {usuario?.rol === "admin" && (
            <>
              <Link to="/admin/jugadores" data-testid="nav-jugadores">
                Jugadores
              </Link>
              <Link to="/admin/rosters" data-testid="nav-rosters">
                Rosters
              </Link>
            </>
          )}
        </nav>
        <div className="sesion">
          {usuario ? (
            <>
              <span data-testid="usuario-email">{usuario.email}</span>
              <button onClick={salir} data-testid="btn-logout">
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/login">Iniciar sesión</Link>
          )}
        </div>
      </header>
      <main className="contenedor">
        <Outlet />
      </main>
    </>
  );
}
