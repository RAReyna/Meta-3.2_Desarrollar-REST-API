const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Jugador = require("./jugador.model");
const { TIPOS_ROSTER, ROLES_EN_ROSTER } = require("../constantes");

const Roster = sequelize.define(
  "Roster",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(255), allowNull: false },
    juego: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "League of Legends",
    },
    tipo: { type: DataTypes.ENUM(...TIPOS_ROSTER), allowNull: false },
    temporada: { type: DataTypes.STRING(255), allowNull: false },
  },
  { tableName: "rosters", timestamps: false },
);

const RosterJugador = sequelize.define(
  "RosterJugador",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_roster: { type: DataTypes.INTEGER, allowNull: false },
    id_jugador: { type: DataTypes.INTEGER, allowNull: false },
    rol_en_roster: {
      type: DataTypes.ENUM(...ROLES_EN_ROSTER),
      allowNull: false,
    },
  },
  { tableName: "roster_jugador", timestamps: false },
);

Roster.hasMany(RosterJugador, {
  foreignKey: "id_roster",
  as: "asignaciones",
  onDelete: "CASCADE",
});
RosterJugador.belongsTo(Roster, { foreignKey: "id_roster" });
Jugador.hasMany(RosterJugador, {
  foreignKey: "id_jugador",
  as: "asignaciones",
  onDelete: "CASCADE",
});
RosterJugador.belongsTo(Jugador, { foreignKey: "id_jugador", as: "jugador" });

module.exports = { Roster, RosterJugador };
