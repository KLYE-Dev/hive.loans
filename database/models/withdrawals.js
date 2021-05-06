'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Withdrawals extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Withdrawals.init({
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    sentto: DataTypes.STRING,
    txid: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    fee: DataTypes.INTEGER,
    coin: DataTypes.STRING,
    confirmed: DataTypes.BOOLEAN,
    confirmedblock: DataTypes.INTEGER,
    confirmedtxid: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Withdrawals',
  });
  return Withdrawals;
};
