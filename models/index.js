'use strict';
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const Sequelize = require('sequelize');
// const process = require('process');
const basename = path.basename(__filename);
const config = {
  database:
    process.env.MYFANZ_DATABASE_NAME || process.env.DEV_MYFANZ_DATABASE_NAME,
  username:
    process.env.MYFANZ_DATABASE_USERNAME ||
    process.env.DEV_MYFANZ_DATABASE_USERNAME,
  password:
    process.env.MYFANZ_DATABASE_PASSWORD ||
    process.env.DEV_MYFANZ_DATABASE_PASSWORD,
  dialect:
    process.env.MYFANZ_DATABASE_DIALECT ||
    process.env.DEV_MYFANZ_DATABASE_DIALECT,
  host: process.env.MYFANZ_DATABASE_HOST || 'localhost',
  port:
    process.env.MYFANZ_DATABASE_PORT ||
    process.env.DEV_MYFANZ_DATABASE_PORT ||
    5432,
  dialectModule: pg,
};

if (!process.env.MYFANZ_DIALECT_OPTIONS) {
  const sslRequired =
    process.env.MYFANZ_DATABASE_SSL ||
    process.env.DEV_MYFANZ_DATABASE_SSL ||
    true;
  config.dialectOptions = {
    ssl: {
      require: sslRequired === 'false' ? false : true,
      rejectUnauthorized: false, // disable SSL verification
    },
  };
}
const db = {};

let sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
