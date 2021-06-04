'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Withdrawals', {
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
      sentto: {
        type: Sequelize.STRING
      },
      txid: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.INTEGER
      },
      fee: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      coin: {
        type: Sequelize.STRING
      },
      confirmed: {
        type: Sequelize.BOOLEAN
      },
      confirmedblock: {
        type: Sequelize.INTEGER
      },
      confirmedtxid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Withdrawals');
  }
};
