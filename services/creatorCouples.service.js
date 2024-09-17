const { CreatorsCouples } = require('./../models');

async function fetchCreatorsCoupleByFilter(filter, raw = false) {
  return CreatorsCouples.findOne({ where: filter, raw });
}

async function fetchCreatorsCouplesByFilter(filter, raw = false) {
  return CreatorsCouples.findAll({ where: filter, raw });
}

module.exports = {
  fetchCreatorsCoupleByFilter,
  fetchCreatorsCouplesByFilter,
};
