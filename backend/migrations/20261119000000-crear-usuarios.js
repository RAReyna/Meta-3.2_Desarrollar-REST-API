"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "usuarios",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        password_hash: { type: Sequelize.STRING(255), allowNull: false },
        rol: {
          type: Sequelize.ENUM("admin", "public"),
          allowNull: false,
          defaultValue: "public",
        },
      },
      { charset: "utf8mb4", collate: "utf8mb4_unicode_ci" },
    );
  },
  async down(queryInterface) {
    await queryInterface.dropTable("usuarios");
  },
};
