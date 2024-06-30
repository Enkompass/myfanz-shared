'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Promotions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  Promotions.init(
    {
      userId: DataTypes.INTEGER,
      group: DataTypes.STRING,
      type: DataTypes.STRING,
      price: DataTypes.NUMERIC(10, 2),
      subscribeCount: DataTypes.INTEGER,
      duration: DataTypes.INTEGER,
      finishAt: DataTypes.DATE,
      discount: DataTypes.INTEGER,
      claimsCount: DataTypes.INTEGER,
      message: DataTypes.STRING,
      link: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: 'Promotions',
    }
  );
  return Promotions;
};
