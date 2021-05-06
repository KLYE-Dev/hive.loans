'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class audit extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  audit.init({
    data: DataTypes.JSON,
    txid: DataTypes.STRING,
    block: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Audits',
  });
  return audit;
};
