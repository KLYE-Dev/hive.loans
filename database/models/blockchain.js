'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Blockchain extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Blockchain.init({
    siteblock: DataTypes.INTEGER,
    headblock: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Blockchain',
  });
  return Blockchain;
};
