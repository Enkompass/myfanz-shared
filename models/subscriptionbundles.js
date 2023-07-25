'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionBundles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
      // this.belongsToMany(models.CreatorSettings, {
      //   as: 'bundles',
      //   foreignKey: 'userId',
      //   sourceKey: 'userId',
      // });
    }
  }
  SubscriptionBundles.init(
    {
      userId: DataTypes.INTEGER,
      price: DataTypes.NUMERIC(10, 2),
      discount: DataTypes.INTEGER,
      duration: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'SubscriptionBundles',
      defaultScope: {
        order: [['duration', 'ASC']],
      },
    }
  );
  return SubscriptionBundles;
};
