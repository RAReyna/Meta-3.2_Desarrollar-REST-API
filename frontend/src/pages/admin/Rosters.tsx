import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import {
  TIPOS_ROSTER,
  type Roster,
  type RosterInput,
  type TipoRoster,
} from "../../types";

export default function Rosters() {
  const qc = useQueryClient();
  const [form, setForm] = useState<RosterInput>({
    nombre: "",
    tipo: "Principal",
    temporada: String(new Date().getFullYear()),
  });
  const [error, setError] = useState("");
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

  const crear = useMutation({
    mutationFn: (r: RosterInput) =>
      api.post<Roster>("/rosters", {
        nombre: r.nombre.trim(),
        tipo: r.tipo,
        temporada: r.temporada.trim(),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      setForm({ ...form, nombre: "" });
    },
    onError: (e) => setError(textoError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => api.del(`/rosters/${id}`),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e) => setError(textoError(e)),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    crear.mutate(form);
  }

  function borrar(r: Roster) {
    if (window.confirm(`¿Eliminar el roster ${r.nombre}?`)) {
      setError("");
      eliminar.mutate(r.id);
    }
  }

  return (
    <>
      <h1>Rosters</h1>

      <form onSubmit={enviar} className="formulario" data-testid="form-roster">
        <label>
          Nombre
          <input
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            data-testid="roster-nombre"
            required
          />
        </label>
        <label>
          Tipo
          <select
            value={form.tipo}
            onChange={(e) =>
              setForm({ ...form, tipo: e.target.value as TipoRoster })
            }
            data-testid="roster-tipo"
          >
            {TIPOS_ROSTER.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Temporada
          <input
            value={form.temporada}
            onChange={(e) => setForm({ ...form, temporada: e.target.value })}
            data-testid="roster-temporada"
            required
          />
        </label>
        <div className="acciones">
          <button
            type="submit"
            disabled={crear.isPending}
            data-testid="roster-guardar"
          >
            Crear roster
          </button>
        </div>
      </form>

      {error && (
        <p className="error" data-testid="error">
          {error}
        </p>
      )}

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.data.map((r) => (
              <tr key={r.id} data-testid="fila-roster">
                <td>{r.nombre}</td>
                <td>{r.tipo}</td>
                <td>{r.temporada}</td>
                <td>{r.cantidad_jugadores ?? 0}</td>
                <td className="acciones">
                  <Link to={`/admin/rosters/${r.id}`} data-testid="btn-ver">
                    Ver / editar
                  </Link>
                  <button
                    className="peligro"
                    onClick={() => borrar(r)}
                    data-testid="btn-eliminar"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
