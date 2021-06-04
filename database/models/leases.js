'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class leases extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  leases.init({
    leaseId: DataTypes.STRING,
    username: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    duration: DataTypes.INTEGER,
    dailypay: DataTypes.INTEGER,
    apr: DataTypes.FLOAT,
    lender: DataTypes.STRING,
    state: DataTypes.STRING,
    fee: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'leases',
  });
  return leases;
};
