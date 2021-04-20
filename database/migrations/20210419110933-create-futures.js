'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('futures', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING
      },
      orderId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      coin: {
        type: Sequelize.STRING,
        allowNull: false,
        default: "hive",
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      openPrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      closePrice: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      stoploss: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      liquidation: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      margin: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      profit: {
        type: Sequelize.INTEGER
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: true,
      },
      spreadfee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      commissionfee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      overnightfee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('futures');
  }
};
