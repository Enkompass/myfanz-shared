'use strict';
const { Model } = require('sequelize');
const async = require('async');
const { getObjectSignedUrl } = require('myfanz-media');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.hasOne(models.UserDetails, {
        as: 'details',
        foreignKey: 'userId',
      });
    }
    async getRole(roleId) {
      const dbRole = await sequelize.models.Role.findOne({
        raw: true,
        where: { id: roleId },
      });
      return dbRole.name;
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      displayName: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      username: DataTypes.STRING,
      emailVerifiedAt: DataTypes.DATE,
      roleId: DataTypes.INTEGER,
      avatar: {
        type: DataTypes.STRING,
      },
      cover: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'User',
      defaultScope: {
        // raw: true,
        attributes: {
          exclude: ['createdAt', 'updatedAt'],
        },
      },
    }
  );

  User.addHook('afterFind', async (result) => {
    if (Array.isArray(result)) {
      return new Promise((resolve, reject) => {
        async.eachLimit(
          result,
          5,
          async (row) => {
            let index = result.findIndex((el) => el.id === row.id);
            // result.role = await getRole(row.roleId);

            if (row.avatar) {
              result[index].avatar = await getObjectSignedUrl(row.avatar);
            }

            if (row.cover) {
              result[index].cover = await getObjectSignedUrl(row.cover);
            }

            // nextRow();
          },
          (err) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    } else {
      return new Promise((resolve) => {
        resolve(result.avatar);
      });
    }

    // return result;
  });

  return User;
};
