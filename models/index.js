'use strict';
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const Sequelize = require('sequelize');
// const process = require('process');
const pg = require('pg');
const basename = path.basename(__filename);
const config = {
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.SHARED_DATABASE_NAME,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    dialect: process.env.DATABASE_DIALECT,
    dialectModule: pg,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // disable SSL verification
      },
    }
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
