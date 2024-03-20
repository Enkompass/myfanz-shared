'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreatorsCouples extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }
  CreatorsCouples.init(
    {
      mainUserId: DataTypes.INTEGER,
      paidUserId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'CreatorsCouples',
    }
  );
  return CreatorsCouples;
};
