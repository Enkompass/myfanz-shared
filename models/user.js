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

      this.hasMany(models.LoginSession, {
        as: 'sessions',
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
      hasCard: DataTypes.BOOLEAN,
      online: DataTypes.BOOLEAN,
      lastActivity: DataTypes.DATE,
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
      scopes: {},
      defaultScope: {
        // raw: true,
        attributes: {
          exclude: ['password', 'createdAt', 'updatedAt'],
        },
      },
    }
  );

  User.addHook('afterFind', async (result, options) => {
    const { ignoreHook } = options;
    if (ignoreHook) return result;

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
      if (!result) return result;
      if (result.avatar)
        result.avatar = await getObjectSignedUrl(result.avatar);
      if (result.cover) result.cover = await getObjectSignedUrl(result.cover);
      return result;
    }

    // return result;
  });

  return User;
};
