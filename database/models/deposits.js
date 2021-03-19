'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Deposits extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Deposits.init({
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    block: DataTypes.STRING,
    txid: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    coin: DataTypes.INTEGER,
    confirms: DataTypes.INTEGER,
    confirmed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Deposits',
  });
  return Deposits;
};
