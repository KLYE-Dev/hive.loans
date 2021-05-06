'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Loans extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Loans.init({
    userId: DataTypes.INTEGER,
    loanId: DataTypes.STRING,
    username: DataTypes.STRING,
    funded: DataTypes.BOOLEAN,
    amount: DataTypes.INTEGER,
    days: DataTypes.INTEGER,
    interest: DataTypes.INTEGER,
    borrower: DataTypes.STRING,
    nextcollect: DataTypes.DATE,
    collected: DataTypes.INTEGER,
    currentpayments: DataTypes.INTEGER,
    totalpayments: DataTypes.INTEGER,
    txid: DataTypes.STRING,
    startblock: DataTypes.INTEGER,
    endtxid: DataTypes.STRING,
    endblock: DataTypes.INTEGER,
    payblocks: DataTypes.STRING,
    active: DataTypes.BOOLEAN,
    completed: DataTypes.BOOLEAN,
    cancelled: DataTypes.BOOLEAN,
    state: DataTypes.STRING,
    fine: DataTypes.INTEGER,
    deployfee:  DataTypes.INTEGER,
    cancelfee: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Loans',
  });
  return Loans;
};
