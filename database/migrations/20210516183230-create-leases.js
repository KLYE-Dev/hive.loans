'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leases', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      leaseId: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      amount: {
        type: Sequelize.INTEGER
      },
      duration: {
        type: Sequelize.INTEGER
      },
      dailypay: {
        type: Sequelize.INTEGER
      },
      apr: {
        type: Sequelize.FLOAT
      },
      lender: {
        type: Sequelize.STRING
      },
      state: {
        type: Sequelize.STRING
      },
      fee: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('leases');
  }
};
