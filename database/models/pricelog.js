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
    hivebtcprice: DataTypes.DECIMAL,
    hiveusdprice: DataTypes.DECIMAL,
    hivevolume: DataTypes.BIGINT,
    hbdbtcprice: DataTypes.DECIMAL,
    hbdusdprice: DataTypes.DECIMAL,
    hbdvolume: DataTypes.BIGINT,
    btcusdprice: DataTypes.BIGINT,
    block: DataTypes.BIGINT,
    synced: DataTypes.BOOLEAN,
    validdate: DataTypes.DATE(4),
  }, {
    sequelize,
    modelName: 'Pricelog',
  });
  return Pricelog;
};
