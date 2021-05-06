'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Loans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER
      },
      loanId: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      funded: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      amount: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      days: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 7
      },
      interest: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 10
      },
      borrower: {
        type: Sequelize.STRING
      },
      nextcollect: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      collected: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      currentpayments: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      totalpayments: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      txid: {
        type: Sequelize.STRING
      },
      startblock: {
        type: Sequelize.INTEGER,
      },
      endtxid: {
        type: Sequelize.STRING
      },
      endblock: {
        type: Sequelize.INTEGER,
      },
      payblocks: {
        type: Sequelize.STRING
      },
      active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completed: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completed: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      state: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: "deployed"
      },
      fine: {
        allowNull: false,
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      deployfee: {
        type: Sequelize.INTEGER
      },
      cancelfee: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Loans');
  }
};
