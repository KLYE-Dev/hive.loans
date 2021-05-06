'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Deposits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING
      },
      block: {
        type: Sequelize.STRING
      },
      txid: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.INTEGER
      },
      coin: {
        type: Sequelize.STRING
      },
      confirms: {
        type: Sequelize.INTEGER
      },
      confirmed: {
        type: Sequelize.BOOLEAN
      },
      confirmedblock: {
        type: Sequelize.INTEGER
      },
      confirmedtxid: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Deposits');
  }
};
