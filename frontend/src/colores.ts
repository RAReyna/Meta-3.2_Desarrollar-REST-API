import type { EstadoJugador, TipoRoster } from "@/types";

// Color de las etiquetas (v-chip) según el valor.
export const COLOR_ESTADO: Record<EstadoJugador, string> = {
  activo: "success",
  inactivo: "grey",
};

export const COLOR_TIPO: Record<TipoRoster, string> = {
  Principal: "primary",
  Academy: "teal",
};
