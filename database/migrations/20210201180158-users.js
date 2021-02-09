'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
  			type: Sequelize.INTEGER,
  		},
      username: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(126)
      },
      rank: {
        allowNull: false,
        defaultValue: "user",
        type: Sequelize.STRING(126)
      },
  		hivebalance: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		hbdbalance: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		hiveprofit: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		address: {
  			type: Sequelize.STRING,
  			defaultValue: 0,
  			allowNull: false
  		},
  		activeloans: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		activelends: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		closedloans: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		closedlends: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		totalloans: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		totallends: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		flags: {
  			type: Sequelize.STRING,
  			defaultValue: 0,
  			allowNull: false
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
  await queryInterface.dropTable('Users');
  }
};
