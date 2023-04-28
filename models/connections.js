'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Connections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.User, {
        hooks: true,
        as: 'user',
        foreignKey: 'id',
        sourceKey: 'userId',
      });
      // this.belongsTo(models.Users, {
      //   as: 'Users',
      //   foreignKey: 'userId',
      // });
      // this.belongsToMany(models.Users, {
      //   through: 'Lists',
      //   foreignKey: 'userId',
      // });
    }
  }
  Connections.init(
    {
      listId: DataTypes.INTEGER,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'Connections',
    }
  );

  // Connections.addHook('afterFind', async (result, options))

  return Connections;
};
