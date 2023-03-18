'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserDetails extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // this.belongsTo(models.User, {
      //   as: 'Users',
      //   foreignKey: 'userId',
      // });
    }
  }
  UserDetails.init(
    {
      userId: { type: DataTypes.INTEGER, unique: true, allowNull: false },
      bio: DataTypes.STRING,
      location: DataTypes.STRING,
      websiteUrl: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'UserDetails',
      defaultScope: {
        // raw: true,
        attributes: { exclude: ['id', 'createdAt', 'updatedAt'] },
      },
    }
  );

  return UserDetails;
};
