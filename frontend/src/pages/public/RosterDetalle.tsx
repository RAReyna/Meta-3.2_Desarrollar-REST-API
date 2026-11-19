import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import type { RosterDetalle as Detalle } from "../../types";

// Vista de solo lectura: datos del roster y sus jugadores, sin controles.
export default function RosterDetalle() {
  const { id } = useParams();
  const detalle = useQuery({
    queryKey: ["roster", id],
    queryFn: () => api.get<Detalle>(`/rosters/${id}`),
  });

  const volver = <Link to="/rosters">← Volver a rosters</Link>;

  if (detalle.isPending) return <p>Cargando…</p>;
  if (detalle.isError) {
    return (
      <>
        <p className="error" data-testid="error">
          {textoError(detalle.error)}
        </p>
        {volver}
      </>
    );
  }

  const roster = detalle.data;
  return (
    <>
      <p>{volver}</p>
      <h1 data-testid="roster-titulo">{roster.nombre}</h1>
      <p>
        {roster.tipo} · Temporada {roster.temporada}
      </p>

      <h2>Jugadores del roster</h2>
      {roster.jugadores.length === 0 ? (
        <p className="vacio" data-testid="roster-sin-jugadores">
          Este roster aún no tiene jugadores.
        </p>
      ) : (
        <table data-testid="tabla-asignados">
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Rol</th>
              <th>Rol en el roster</th>
            </tr>
          </thead>
          <tbody>
            {roster.jugadores.map((j) => (
              <tr key={j.id} data-testid="fila-asignado">
                <td>{j.nickname}</td>
                <td>{j.rol}</td>
                <td>{j.rol_en_roster}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
