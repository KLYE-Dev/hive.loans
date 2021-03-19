'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Ownerkeys', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      uid: {
        type: Sequelize.INTEGER
      },
      loanId: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      owned: {
          allowNull: false,
          defaultValue: false,
          type: Sequelize.BOOLEAN
      },
      powerdown: {
          allowNull: false,
          defaultValue: false,
          type: Sequelize.BOOLEAN
      },
      oldkeys: {
        type: Sequelize.STRING
      },
      newkeys: {
        type: Sequelize.STRING(1024)
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
    await queryInterface.dropTable('Ownerkeys');
  }
};
