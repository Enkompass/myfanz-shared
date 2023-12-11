'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StripeDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  StripeDetails.init(
    {
      userId: DataTypes.INTEGER,
      customerId: DataTypes.STRING,
      accountId: DataTypes.STRING,
      defaultPaymentMethodId: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'StripeDetails',
    }
  );
  return StripeDetails;
};
