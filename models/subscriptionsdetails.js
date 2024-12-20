'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubscriptionsDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here

      this.belongsTo(models.Connections, {
        // through: 'Lists',
        foreignKey: 'id',
        // sourceKey: 'connectionId',
      });
    }
  }
  SubscriptionsDetails.init(
    {
      connectionId: DataTypes.INTEGER,
      price: DataTypes.NUMERIC(10, 2),
      expireAt: DataTypes.DATE,
      unsubscribeReason: DataTypes.INTEGER,
      expiredAt: DataTypes.DATE,
      autoRenewal: DataTypes.BOOLEAN,
      checkRenewal: DataTypes.BOOLEAN,
      type: DataTypes.STRING,
      planId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'SubscriptionsDetails',
    }
  );
  return SubscriptionsDetails;
};
