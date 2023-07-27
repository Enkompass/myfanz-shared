'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReportedUsers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // this.hasOne(models.Reports, {
      //   as: 'report',
      //   foreignKey: 'id',
      //   sourceKey: 'reportId',
      // });
    }
  }
  ReportedUsers.init(
    {
      userId: DataTypes.INTEGER,
      byUserId: DataTypes.INTEGER,
      reportId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'ReportedUsers',
    }
  );
  return ReportedUsers;
};
