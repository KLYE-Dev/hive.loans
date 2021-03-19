'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ownerkeys extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Ownerkeys.init({
    uid: DataTypes.INTEGER,
    loanId: DataTypes.STRING,
    username: DataTypes.STRING,
    owned: DataTypes.BOOLEAN,
    powerdown: DataTypes.BOOLEAN,
    oldkeys: DataTypes.STRING,
    newkeys: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Ownerkeys',
  });
  return Ownerkeys;
};
