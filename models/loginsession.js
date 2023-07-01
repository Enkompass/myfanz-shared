'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LoginSession extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        as: 'Users',
        foreignKey: 'userId',
      });
    }
  }
  LoginSession.init(
    {
      userId: DataTypes.INTEGER,
      ipAddress: DataTypes.STRING,
      country: DataTypes.STRING,
      os: DataTypes.STRING,
      client: DataTypes.STRING,
      brand: DataTypes.STRING,
      active: DataTypes.BOOLEAN,
      lastActivity: DataTypes.DATE,
      twoFactorSaved: DataTypes.BOOLEAN,
      twoFactorSmsSaved: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'LoginSession',
      scopes: {
        onlyDevice: {
          attributes: {
            exclude: [
              'twoFactorSaved',
              'twoFactorSmsSaved',
              'createdAt',
              'updatedAt',
            ],
          },
        },
      },
    }
  );
  return LoginSession;
};
