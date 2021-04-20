'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class futures extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  futures.init({
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    orderId: DataTypes.STRING,
    type: DataTypes.STRING,
    coin: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    openPrice: DataTypes.INTEGER,
    closePrice: DataTypes.INTEGER,
    stoploss: DataTypes.INTEGER,
    liquidation: DataTypes.INTEGER,
    margin: DataTypes.INTEGER,
    profit: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN,
    spreadfee: DataTypes.INTEGER,
    commissionfee: DataTypes.INTEGER,
    overnightfee: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'futures',
  });
  return futures;
};
