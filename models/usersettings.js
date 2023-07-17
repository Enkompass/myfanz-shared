'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSettings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        as: 'Settings',
        foreignKey: 'userId',
      });
    }
  }
  UserSettings.init(
    {
      userId: { type: DataTypes.INTEGER, unique: true, allowNull: false },
      languageId: DataTypes.INTEGER,
      theme: DataTypes.STRING,
      showActivityStatus: DataTypes.BOOLEAN,
      showSubscriptionOffers: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'UserSettings',
      defaultScope: {
        attributes: { exclude: ['id', 'userId', 'createdAt', 'updatedAt'] },
      },
      scopes: {
        base: {
          attributes: {
            exclude: [
              'id',
              'userId',
              'showActivityStatus',
              'showSubscriptionOffers',
              'createdAt',
              'updatedAt',
            ],
          },
        },
      },
    }
  );
  return UserSettings;
};
