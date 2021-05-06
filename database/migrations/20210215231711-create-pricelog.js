'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Pricelogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      hivebtcprice: {
        type: Sequelize.DECIMAL,
      },
      hiveusdprice: {
        type: Sequelize.DECIMAL,
      },
      hbdbtcprice: {
        type: Sequelize.DECIMAL,
      },
      hbdusdprice: {
        type: Sequelize.DECIMAL,
      },
      btcusdprice: {
        type: Sequelize.BIGINT,
      },
      block: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.BIGINT,
      },
      synced: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN,
      },
      validdate: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        defaultValue: Sequelize.NOW,
        type: Sequelize.DATE,
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Pricelogs');
  }
};
