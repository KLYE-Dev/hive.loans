'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Messages extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  Messages.init({
    userId: DataTypes.INTEGER,
    username: DataTypes.STRING,
    rank: DataTypes.BOOLEAN,
    lvl: DataTypes.INTEGER,
    msg: DataTypes.STRING,
    rng: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Messages',
  });
  return Messages;
};
