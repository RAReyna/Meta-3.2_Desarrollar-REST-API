export const ROLES = ["Top", "Jungle", "Mid", "ADC", "Support"] as const;
export const ESTADOS = ["activo", "inactivo"] as const;
export const TIPOS_ROSTER = ["Principal", "Academy"] as const;
export const ROLES_EN_ROSTER = ["Titular", "Suplente"] as const;

export type RolJugador = (typeof ROLES)[number];
export type EstadoJugador = (typeof ESTADOS)[number];
export type TipoRoster = (typeof TIPOS_ROSTER)[number];
export type RolEnRoster = (typeof ROLES_EN_ROSTER)[number];

export interface Jugador {
  id: number;
  nickname: string;
  nombre_real: string | null;
  pais: string | null;
  rol: RolJugador;
  estado: EstadoJugador;
}

export interface JugadorInput {
  nickname: string;
  nombre_real?: string | null;
  pais?: string | null;
  rol: RolJugador;
  estado: EstadoJugador;
}

export interface Roster {
  id: number;
  nombre: string;
  juego: string;
  tipo: TipoRoster;
  temporada: string;
  cantidad_jugadores?: number;
}

export interface RosterInput {
  nombre: string;
  tipo: TipoRoster;
  temporada: string;
}

export interface JugadorEnRoster {
  id: number;
  nickname: string;
  rol: RolJugador;
  rol_en_roster: RolEnRoster;
}

export interface RosterDetalle extends Roster {
  jugadores: JugadorEnRoster[];
}

export interface Usuario {
  id: number;
  email: string;
  rol: "admin" | "public";
}
