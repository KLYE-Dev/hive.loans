'use strict';
const {Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    static associate(models) {

    }
  }
  Users.init({
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    rank: DataTypes.STRING,
    hivebalance: DataTypes.BIGINT.UNSIGNED,
    hbdbalance: DataTypes.BIGINT.UNSIGNED,
    hiveprofit: DataTypes.BIGINT.UNSIGNED,
    address: DataTypes.STRING,
    activeloans: DataTypes.BIGINT.UNSIGNED,
    activelends: DataTypes.BIGINT.UNSIGNED,
    closedloans: DataTypes.BIGINT.UNSIGNED,
    closedlends: DataTypes.BIGINT.UNSIGNED,
    totalloans: DataTypes.BIGINT.UNSIGNED,
    totallends: DataTypes.BIGINT.UNSIGNED,
    flags: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Users',
  });
  /*
  User.associate = function (models) {
    User.hasMany(models.Deposits, { foreignKey: 'userId'});
    User.hasMany(models.Withdrawals, { foreignKey: 'userId'});
    User.hasMany(models.Bets, { foreignKey: 'userId'});
    User.hasMany(models.Addresses, { foreignKey: 'userId'});
  };
  */
  return Users;
};
