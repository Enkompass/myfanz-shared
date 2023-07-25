'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreatorSettings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.SubscriptionBundles, {
        as: 'subscriptionBundles',
        foreignKey: 'userId',
        sourceKey: 'userId',
      });
    }
  }
  CreatorSettings.init(
    {
      userId: DataTypes.INTEGER,
      followBack: DataTypes.BOOLEAN,
      subscriptionPrice: DataTypes.NUMERIC(10, 2),
      subscriptionDays: DataTypes.INTEGER,
      // allowFreeSubscription: DataTypes.BOOLEAN,
      sendWelcomeMessage: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'CreatorSettings',
    }
  );
  return CreatorSettings;
};
