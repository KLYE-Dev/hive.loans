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
    level: DataTypes.INTEGER,
    xp: DataTypes.BIGINT,
    xpmulti: DataTypes.INTEGER,
    siterank: DataTypes.INTEGER,
    disclaimer: DataTypes.BOOLEAN,
    hivebalance: DataTypes.BIGINT,
    hbdbalance: DataTypes.BIGINT,
    hiveprofit: DataTypes.BIGINT,
    shares: DataTypes.INTEGER,
    shareprofit: DataTypes.BIGINT,
    cfdprofit: DataTypes.BIGINT.UNSIGNED,
    address: DataTypes.STRING,
    sitedelegation: DataTypes.BIGINT.UNSIGNED,
    emergencyaddress: DataTypes.STRING,
    activeorder: DataTypes.INTEGER,
    closedorder: DataTypes.INTEGER,
    totalorder: DataTypes.BIGINT.UNSIGNED,
    feesorder: DataTypes.BIGINT.UNSIGNED,
    activecfdtrade: DataTypes.INTEGER,
    closedcfdtrade: DataTypes.INTEGER,
    totalcfdtrade: DataTypes.BIGINT.UNSIGNED,
    feescfdtrade: DataTypes.BIGINT.UNSIGNED,
    activeloans: DataTypes.INTEGER,
    closedloans: DataTypes.INTEGER,
    feesloans: DataTypes.BIGINT.UNSIGNED,
    totalloans: DataTypes.BIGINT.UNSIGNED,
    activelends: DataTypes.INTEGER,
    closedlends: DataTypes.INTEGER,
    totallends: DataTypes.BIGINT.UNSIGNED,
    feeslends: DataTypes.BIGINT.UNSIGNED,
    deposits: DataTypes.INTEGER,
    depositstotal: DataTypes.BIGINT.UNSIGNED,
    withdrawals: DataTypes.INTEGER,
    withdrawalstotal: DataTypes.BIGINT.UNSIGNED,
    withdrawalsfee: DataTypes.BIGINT.UNSIGNED,
    totalfees: DataTypes.BIGINT.UNSIGNED,
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
