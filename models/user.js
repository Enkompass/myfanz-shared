'use strict';
const { Model } = require('sequelize');
const { getProfilePhotoLink } = require('../helpers/helpers');

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

      this.hasOne(models.UserSettings, {
        as: 'UserSettings',
        foreignKey: 'userId',
      });

      this.hasOne(models.CreatorSettings, {
        as: 'creatorSettings',
        foreignKey: 'userId',
      });

      this.hasMany(models.SubscriptionBundles, {
        as: 'userSubscriptionBundles',
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
        if (getAvatar) el.avatar = getProfilePhotoLink(el.avatar);

        if (el.cover) {
          if (getCover) el.cover = getProfilePhotoLink(el.cover);
          else if (getSmallCover)
            el.cover = getProfilePhotoLink(el.cover, 'small');
        }
      });
    } else {
      if (!result) return result;
      if (getAvatar) result.avatar = getProfilePhotoLink(result.avatar);
      if (result.cover) {
        if (getCover) result.cover = getProfilePhotoLink(result.cover);
        else if (getSmallCover)
          result.cover = getProfilePhotoLink(result.cover, 'small');
      }
      return result;
    }

    // return result;
  });

  return User;
};
