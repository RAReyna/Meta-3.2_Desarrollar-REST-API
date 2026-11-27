"use strict";
const { Model } = require("sequelize");
const { ROLES_EN_ROSTER } = require("../src/constantes.js");

// Asignación de un jugador a un roster, con su rol en él (Titular/Suplente).
module.exports = (sequelize, DataTypes) => {
  class RosterJugador extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // El ON DELETE CASCADE vive en la base (migración 3): al borrar un
      // roster o un jugador se borran sus asignaciones, nunca el otro lado.
      this.belongsTo(models.Roster, { foreignKey: "id_roster", as: "roster" });
      this.belongsTo(models.Jugador, {
        foreignKey: "id_jugador",
        as: "jugador",
      });
    }
  }

  RosterJugador.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      id_roster: { type: DataTypes.INTEGER, allowNull: false },
      id_jugador: { type: DataTypes.INTEGER, allowNull: false },
      rol_en_roster: {
        type: DataTypes.ENUM(...ROLES_EN_ROSTER),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "RosterJugador",
      tableName: "roster_jugador",
      timestamps: false,
      indexes: [
        {
          name: "roster_jugador_unico",
          unique: true,
          fields: ["id_roster", "id_jugador"],
        },
      ],
    },
  );
  return RosterJugador;
};
