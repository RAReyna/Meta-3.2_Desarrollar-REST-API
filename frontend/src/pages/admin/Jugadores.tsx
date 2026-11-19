import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import {
  ESTADOS,
  ROLES,
  type EstadoJugador,
  type Jugador,
  type RolJugador,
} from "../../types";

interface FormJugador {
  nickname: string;
  nombre_real: string;
  pais: string;
  rol: RolJugador;
  estado: EstadoJugador;
}

const VACIO: FormJugador = {
  nickname: "",
  nombre_real: "",
  pais: "",
  rol: "Top",
  estado: "activo",
};

export default function Jugadores() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormJugador>(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");
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

  function cancelar() {
    setForm(VACIO);
    setEditId(null);
    setError("");
  }

  const guardar = useMutation({
    mutationFn: (f: FormJugador) => {
      const body: Record<string, string> = {
        nickname: f.nickname.trim(),
        rol: f.rol,
        estado: f.estado,
      };
      if (f.nombre_real.trim()) body.nombre_real = f.nombre_real.trim();
      if (f.pais.trim()) body.pais = f.pais.trim();
      return editId === null
        ? api.post<Jugador>("/jugadores", body)
        : api.put<Jugador>(`/jugadores/${editId}`, body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries();
      cancelar();
    },
    onError: (e) => setError(textoError(e)),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => api.del(`/jugadores/${id}`),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e) => setError(textoError(e)),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    guardar.mutate(form);
  }

  function editar(j: Jugador) {
    setError("");
    setEditId(j.id);
    setForm({
      nickname: j.nickname,
      nombre_real: j.nombre_real ?? "",
      pais: j.pais ?? "",
      rol: j.rol,
      estado: j.estado,
    });
  }

  function borrar(j: Jugador) {
    if (window.confirm(`¿Eliminar al jugador ${j.nickname}?`)) {
      setError("");
      eliminar.mutate(j.id);
    }
  }

  return (
    <>
      <h1>Jugadores</h1>

      <form onSubmit={enviar} className="formulario" data-testid="form-jugador">
        <label>
          Nickname
          <input
            value={form.nickname}
            onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            data-testid="jugador-nickname"
            required
          />
        </label>
        <label>
          Nombre real
          <input
            value={form.nombre_real}
            onChange={(e) => setForm({ ...form, nombre_real: e.target.value })}
            data-testid="jugador-nombre-real"
          />
        </label>
        <label>
          País
          <input
            value={form.pais}
            onChange={(e) => setForm({ ...form, pais: e.target.value })}
            data-testid="jugador-pais"
          />
        </label>
        <label>
          Rol
          <select
            value={form.rol}
            onChange={(e) =>
              setForm({ ...form, rol: e.target.value as RolJugador })
            }
            data-testid="jugador-rol"
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({ ...form, estado: e.target.value as EstadoJugador })
            }
            data-testid="jugador-estado"
          >
            {ESTADOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="acciones">
          <button
            type="submit"
            disabled={guardar.isPending}
            data-testid="jugador-guardar"
          >
            {editId === null ? "Crear jugador" : "Guardar cambios"}
          </button>
          {editId !== null && (
            <button
              type="button"
              className="secundario"
              onClick={cancelar}
              data-testid="jugador-cancelar"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="error" data-testid="error">
          {error}
        </p>
      )}

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
              <th></th>
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
                <td className="acciones">
                  <button
                    className="secundario"
                    onClick={() => editar(j)}
                    data-testid="btn-editar"
                  >
                    Editar
                  </button>
                  <button
                    className="peligro"
                    onClick={() => borrar(j)}
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
