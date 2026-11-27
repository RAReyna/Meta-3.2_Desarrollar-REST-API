"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Sin asociaciones por ahora.
    }
  }

  Usuario.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      rol: {
        type: DataTypes.ENUM("admin", "public"),
        allowNull: false,
        defaultValue: "public",
      },
    },
    {
      sequelize,
      modelName: "Usuario",
      tableName: "usuarios",
      timestamps: false,
    },
  );
  return Usuario;
};
