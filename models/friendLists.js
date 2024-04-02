'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FriendLists extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.User, {
        as: 'userOne',
        foreignKey: 'userOneId',
      });
      this.belongsTo(models.User, {
        as: 'userTwo',
        foreignKey: 'userTwoId',
      });
    }
  }
  FriendLists.init(
    {
      userOneId: { type: DataTypes.INTEGER, allowNull: false },
      userTwoId: { type: DataTypes.INTEGER, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'accepted'),
        defaultValue: 'pending',
      },
    },
    {
      sequelize,
      modelName: 'FriendLists',
    }
  );
  return FriendLists;
};
