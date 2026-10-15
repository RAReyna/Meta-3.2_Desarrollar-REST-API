"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "roster_jugador",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        id_roster: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "rosters", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        id_jugador: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: "jugadores", key: "id" },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        rol_en_roster: {
          type: Sequelize.ENUM("Titular", "Suplente"),
          allowNull: false,
        },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );

    await queryInterface.addConstraint("roster_jugador", {
      fields: ["id_roster", "id_jugador"],
      type: "unique",
      name: "roster_jugador_unico",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("roster_jugador");
  },
};
