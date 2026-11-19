"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable("usuarios");
    if (!cols.google_id) {
      await queryInterface.addColumn("usuarios", "google_id", {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      });
    }
    await queryInterface.changeColumn("usuarios", "password_hash", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    const cols = await queryInterface.describeTable("usuarios");
    if (cols.google_id) await queryInterface.removeColumn("usuarios", "google_id");
    await queryInterface.changeColumn("usuarios", "password_hash", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
