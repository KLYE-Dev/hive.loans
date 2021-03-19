'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Pricelog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Pricelog.init({
    hiveusdprice: DataTypes.DECIMAL(9,8).UNSIGNED,
    hivebtcprice: DataTypes.DECIMAL(6,5).UNSIGNED,
    block: DataTypes.BIGINT.UNSIGNED,
  }, {
    sequelize,
    modelName: 'Pricelog',
  });
  return Pricelog;
};
