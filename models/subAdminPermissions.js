'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SubAdminPermissions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        as: 'Users',
        foreignKey: 'userId',
      });
    }
  }
  SubAdminPermissions.init(
    {
      permissionGroupIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      invitationToken: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'SubAdminPermissions',
      defaultScope: {
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
    }
  );
  return SubAdminPermissions;
};
