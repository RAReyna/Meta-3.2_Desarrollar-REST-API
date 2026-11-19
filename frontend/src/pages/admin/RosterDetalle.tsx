import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api";
import { textoError } from "../../errores";
import {
  ROLES_EN_ROSTER,
  TIPOS_ROSTER,
  type Jugador,
  type JugadorEnRoster,
  type RolEnRoster,
  type RosterDetalle as Detalle,
  type RosterInput,
  type TipoRoster,
} from "../../types";

// Formulario de edición: recibe los valores iniciales por props.
function EditarRoster({ roster }: { roster: Detalle }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<RosterInput>({
    nombre: roster.nombre,
    tipo: roster.tipo,
    temporada: roster.temporada,
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const guardar = useMutation({
    mutationFn: (r: RosterInput) =>
      api.put(`/rosters/${roster.id}`, {
        nombre: r.nombre.trim(),
        tipo: r.tipo,
        temporada: r.temporada.trim(),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      setOk(true);
    },
    onError: (e) => setError(textoError(e)),
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    guardar.mutate(form);
  }

  return (
    <>
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
            disabled={guardar.isPending}
            data-testid="roster-guardar"
          >
            Guardar cambios
          </button>
        </div>
      </form>
      {ok && <p data-testid="roster-guardado">Cambios guardados.</p>}
      {error && (
        <p className="error" data-testid="error-roster">
          {error}
        </p>
      )}
    </>
  );
}

export default function RosterDetalle() {
  const qc = useQueryClient();
  const { id } = useParams();
  const rid = Number(id);
  const [error, setError] = useState("");
  const [jugadorId, setJugadorId] = useState("");
  const [rolEn, setRolEn] = useState<RolEnRoster>("Titular");

  const detalle = useQuery({
    queryKey: ["roster", rid],
    queryFn: () => api.get<Detalle>(`/rosters/${rid}`),
    enabled: !Number.isNaN(rid),
  });
  const todos = useQuery({
    queryKey: ["jugadores", "todos"],
    queryFn: () => api.get<Jugador[]>("/jugadores"),
  });

  const asignar = useMutation({
    mutationFn: () =>
      api.post(`/rosters/${rid}/jugadores`, {
        id_jugador: Number(jugadorId),
        rol_en_roster: rolEn,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries();
      setJugadorId("");
    },
    onError: (e) => setError(textoError(e)),
  });

  const cambiarRol = useMutation({
    mutationFn: (v: { jugador: number; rol: RolEnRoster }) =>
      api.put(`/rosters/${rid}/jugadores/${v.jugador}`, {
        rol_en_roster: v.rol,
      }),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e) => setError(textoError(e)),
  });

  const quitar = useMutation({
    mutationFn: (jugador: number) =>
      api.del(`/rosters/${rid}/jugadores/${jugador}`),
    onSuccess: () => qc.invalidateQueries(),
    onError: (e) => setError(textoError(e)),
  });

  if (Number.isNaN(rid)) return <p className="error">Roster inválido</p>;
  if (detalle.isPending) return <p>Cargando…</p>;
  if (detalle.isError) {
    return (
      <>
        <p className="error" data-testid="error">
          {textoError(detalle.error)}
        </p>
        <Link to="/admin/rosters">Volver a rosters</Link>
      </>
    );
  }

  const roster = detalle.data;
  const asignados = new Set(roster.jugadores.map((j) => j.id));
  const disponibles = (todos.data ?? []).filter((j) => !asignados.has(j.id));

  function enviarAsignacion(e: FormEvent) {
    e.preventDefault();
    setError("");
    asignar.mutate();
  }

  function quitarJugador(j: JugadorEnRoster) {
    if (window.confirm(`¿Quitar a ${j.nickname} del roster?`)) {
      setError("");
      quitar.mutate(j.id);
    }
  }

  return (
    <>
      <p>
        <Link to="/admin/rosters">← Volver a rosters</Link>
      </p>
      <h1 data-testid="roster-titulo">{roster.nombre}</h1>

      {/* key: al cambiar de roster el formulario se reinicia (no al guardar) */}
      <EditarRoster key={roster.id} roster={roster} />

      <h2>Jugadores del roster</h2>

      <form
        onSubmit={enviarAsignacion}
        className="formulario"
        data-testid="form-asignar"
      >
        <label>
          Jugador
          <select
            value={jugadorId}
            onChange={(e) => setJugadorId(e.target.value)}
            data-testid="asignar-jugador"
          >
            <option value="">Selecciona…</option>
            {disponibles.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nickname} ({j.rol})
              </option>
            ))}
          </select>
        </label>
        <label>
          Rol en el roster
          <select
            value={rolEn}
            onChange={(e) => setRolEn(e.target.value as RolEnRoster)}
            data-testid="asignar-rol"
          >
            {ROLES_EN_ROSTER.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <div className="acciones">
          <button
            type="submit"
            disabled={!jugadorId || asignar.isPending}
            data-testid="asignar-submit"
          >
            Asignar jugador
          </button>
        </div>
      </form>

      {error && (
        <p className="error" data-testid="error">
          {error}
        </p>
      )}

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {roster.jugadores.map((j) => (
              <tr key={j.id} data-testid="fila-asignado">
                <td>{j.nickname}</td>
                <td>{j.rol}</td>
                <td>
                  <select
                    value={j.rol_en_roster}
                    onChange={(e) => {
                      setError("");
                      cambiarRol.mutate({
                        jugador: j.id,
                        rol: e.target.value as RolEnRoster,
                      });
                    }}
                    data-testid="rol-en-roster"
                  >
                    {ROLES_EN_ROSTER.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td className="acciones">
                  <button
                    className="peligro"
                    onClick={() => quitarJugador(j)}
                    data-testid="btn-quitar"
                  >
                    Quitar
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
