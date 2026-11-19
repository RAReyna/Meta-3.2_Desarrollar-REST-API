"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "jugadores",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        nickname: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        nombre_real: { type: Sequelize.STRING(255), allowNull: true },
        pais: { type: Sequelize.STRING(255), allowNull: true },
        rol: {
          type: Sequelize.ENUM("Top", "Jungle", "Mid", "ADC", "Support"),
          allowNull: false,
        },
        estado: {
          type: Sequelize.ENUM("activo", "inactivo"),
          allowNull: false,
          defaultValue: "activo",
        },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("jugadores");
  },
};
