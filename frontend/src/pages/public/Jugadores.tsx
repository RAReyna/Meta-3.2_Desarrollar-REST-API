import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import { ESTADOS, ROLES, type Jugador } from "../../types";

// Vista de solo lectura: lista con búsqueda y filtros, sin edición.
export default function Jugadores() {
  const [search, setSearch] = useState("");
  const [fRol, setFRol] = useState("");
  const [fEstado, setFEstado] = useState("");

  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  if (fRol) params.set("rol", fRol);
  if (fEstado) params.set("estado", fEstado);
  const qs = params.toString();

  const lista = useQuery({
    queryKey: ["jugadores", qs],
    queryFn: () => api.get<Jugador[]>(`/jugadores${qs ? `?${qs}` : ""}`),
  });

  return (
    <>
      <h1>Jugadores</h1>

      <div className="filtros">
        <input
          placeholder="Buscar por nickname"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="filtro-search"
        />
        <select
          value={fRol}
          onChange={(e) => setFRol(e.target.value)}
          data-testid="filtro-rol"
        >
          <option value="">Todos los roles</option>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
          data-testid="filtro-estado"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {lista.isPending && <p>Cargando…</p>}
      {lista.isError && <p className="error">{textoError(lista.error)}</p>}
      {lista.data && lista.data.length === 0 && (
        <p className="vacio" data-testid="jugadores-vacio">
          No hay jugadores.
        </p>
      )}
      {lista.data && lista.data.length > 0 && (
        <table data-testid="tabla-jugadores">
          <thead>
            <tr>
              <th>Nickname</th>
              <th>Nombre real</th>
              <th>País</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.data.map((j) => (
              <tr key={j.id} data-testid="fila-jugador">
                <td>{j.nickname}</td>
                <td>{j.nombre_real ?? "—"}</td>
                <td>{j.pais ?? "—"}</td>
                <td>{j.rol}</td>
                <td>{j.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
