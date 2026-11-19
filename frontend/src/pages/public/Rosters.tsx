import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import { TIPOS_ROSTER, type Roster } from "../../types";

// Vista de solo lectura: lista con filtros, sin crear ni eliminar.
export default function Rosters() {
  const [fTipo, setFTipo] = useState("");
  const [fTemporada, setFTemporada] = useState("");

  const params = new URLSearchParams();
  if (fTipo) params.set("tipo", fTipo);
  if (fTemporada.trim()) params.set("temporada", fTemporada.trim());
  const qs = params.toString();

  const lista = useQuery({
    queryKey: ["rosters", qs],
    queryFn: () => api.get<Roster[]>(`/rosters${qs ? `?${qs}` : ""}`),
  });

  return (
    <>
      <h1>Rosters</h1>

      <div className="filtros">
        <select
          value={fTipo}
          onChange={(e) => setFTipo(e.target.value)}
          data-testid="filtro-tipo"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_ROSTER.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <input
          placeholder="Temporada"
          value={fTemporada}
          onChange={(e) => setFTemporada(e.target.value)}
          data-testid="filtro-temporada"
        />
      </div>

      {lista.isPending && <p>Cargando…</p>}
      {lista.isError && <p className="error">{textoError(lista.error)}</p>}
      {lista.data && lista.data.length === 0 && (
        <p className="vacio" data-testid="rosters-vacio">
          No hay rosters.
        </p>
      )}
      {lista.data && lista.data.length > 0 && (
        <table data-testid="tabla-rosters">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Temporada</th>
              <th>Jugadores</th>
            </tr>
          </thead>
          <tbody>
            {lista.data.map((r) => (
              <tr key={r.id} data-testid="fila-roster">
                <td>
                  <Link to={`/rosters/${r.id}`} data-testid="btn-ver">
                    {r.nombre}
                  </Link>
                </td>
                <td>{r.tipo}</td>
                <td>{r.temporada}</td>
                <td>{r.cantidad_jugadores ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
