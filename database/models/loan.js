'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Loan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Loan.init({
    userId: DataTypes.INTEGER,
    loanId: DataTypes.STRING,
    username: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    days: DataTypes.INTEGER,
    interest: DataTypes.INTEGER,
    borrower: DataTypes.STRING,
    nextcollect: DataTypes.DATE,
    collected: DataTypes.INTEGER,
    currentpayments:  DataTypes.INTEGER,
    totalpayments:  DataTypes.INTEGER,
    active: DataTypes.BOOLEAN,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Loan',
  });
  return Loan;
};
