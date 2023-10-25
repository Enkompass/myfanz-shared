'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Referrals extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  Referrals.init(
    {
      userId: DataTypes.INTEGER,
      referralId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Referrals',
    }
  );
  return Referrals;
};
