'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CardAccounts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  CardAccounts.init(
    {
      userId: DataTypes.INTEGER,
      email: DataTypes.STRING,
      cardFingerprint: DataTypes.STRING,
      cardId: DataTypes.STRING,
      brand: DataTypes.STRING,
      expMonth: DataTypes.STRING,
      expYear: DataTypes.STRING,
      last4: DataTypes.STRING,
      default: DataTypes.BOOLEAN,
      addressCountry: DataTypes.STRING,
      addressState: DataTypes.STRING,
      addressCity: DataTypes.STRING,
      addressLine1: DataTypes.STRING,
      addressZip: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'CardAccounts',
    }
  );
  return CardAccounts;
};
