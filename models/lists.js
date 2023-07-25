'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lists extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasMany(models.Connections, {
        as: 'connections',
        foreignKey: 'listId',
      });

      this.hasOne(models.Connections, {
        as: 'connection',
        foreignKey: 'listId',
      });

      this.hasOne(models.BaseLists, {
        as: 'basicLists',
        foreignKey: 'type',
        sourceKey: 'type',
      });

      // this.hasOne(models.LiveStreams, {
      //   as: 'stream',
      //   foreignKey: 'listId',
      // });

      // this.hasOne(models.Users, {
      //   as: 'user',
      //   // foreignKey: ''
      // });
    }
  }
  Lists.init(
    {
      name: {
        type: DataTypes.STRING,
      },
      type: DataTypes.STRING,
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Lists',
    }
  );
  return Lists;
};
