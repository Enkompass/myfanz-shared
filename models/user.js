'use strict';
const { Model } = require('sequelize');
const { isValidUrl } = require('../helpers/helpers');

const mainAppUrl = process.env.APP_URL || process.env.MAIN_APP_URL;

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
      // online: DataTypes.BOOLEAN,
      lastActivity: DataTypes.DATE,
      active: DataTypes.BOOLEAN,
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
        attributes: { exclude: ['password', 'id', 'twoFactorSecret'] },
      },
      scopes: {
        withPassword: {
          attributes: { exclude: ['id'] },
        },
        withId: {
          attributes: { exclude: ['password', 'twoFactorSecret'] },
        },
        withAll: {
          attributes: {},
        },
      },
    }
  );

  User.addHook('afterFind', async (result, options) => {
    const { ignoreHook, getAvatar, getCover, getSmallCover } = options;
    console.log('hook after find ', ignoreHook);
    console.log('hook after find getAvatar ', getAvatar);
    if (ignoreHook) return result;
    if (Array.isArray(result)) {
      return result.map((el) => {
        if (getAvatar && el.avatar && !isValidUrl(el.avatar)) {
          el.avatar = `${mainAppUrl}/uploads/${el.avatar}`;
        }

        if (el.cover) {
          if (getCover) el.cover = `${mainAppUrl}/uploads/${el.cover}`;
          if (getSmallCover) {
            const splitFileName = el.cover.split('/');
            el.cover = `${mainAppUrl}/uploads/${splitFileName[0]}/small-${splitFileName[1]}`;
          }
        }
      });
    } else {
      if (!result) return result;
      if (getAvatar && result.avatar && !isValidUrl(result.avatar))
        result.avatar = `${mainAppUrl}/uploads/${result.avatar}`;
      if (result.cover) {
        if (getCover) result.cover = `${mainAppUrl}/uploads/${result.cover}`;
        if (getSmallCover) {
          const splitFileName = result.cover.split('/');
          result.cover = `${mainAppUrl}/uploads/${splitFileName[0]}/small-${splitFileName[1]}`;
        }
      }
      return result;
    }

    // return result;
  });

  return User;
};
