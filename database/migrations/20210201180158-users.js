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
      moderator: {
        allowNull: false,
        defaultValue: false,
        type: Sequelize.BOOLEAN
      },
      username: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(16)
      },
      rank: {
        allowNull: false,
        defaultValue: "user",
        type: Sequelize.STRING(126)
      },
      level: {
        type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
      },
      xp: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      xpmulti : {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      siterank: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      disclaimer: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
  		hivebalance: {
  			type: Sequelize.BIGINT,
  			defaultValue: 0,
  			allowNull: false
  		},
  		hbdbalance: {
  			type: Sequelize.BIGINT,
  			defaultValue: 0,
  			allowNull: false
  		},
  		hiveprofit: {
  			type: Sequelize.BIGINT,
  			defaultValue: 0,
  			allowNull: false
  		},
      shares: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      shareprofit: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      cfdprofit: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      invested: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
        allowNull: false
      },
      investedprofit: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      investedpercent: {
        type: Sequelize.DECIMAL,
        defaultValue: 0,
        allowNull: false
      },
  		address: {
  			type: Sequelize.STRING,
  			defaultValue: 0,
  			allowNull: false
  		},
      sitedelegation: {
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
        allowNull: false
      },
      emergencyaddress: {
  			type: Sequelize.STRING(16),
  			defaultValue: 0,
  			allowNull: false
  		},
      activeorder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      closedorder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      totalorder: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      feesorder: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      activecfdtrade: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      closedcfdtrade: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      totalcfdtrade: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      feescfdtrade: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
  		activeloans: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
      closedloans: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      feesloans: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      totalloans: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
  		activelends: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		closedlends: {
  			type: Sequelize.INTEGER,
  			defaultValue: 0,
  			allowNull: false
  		},
  		totallends: {
  			type: Sequelize.BIGINT,
  			defaultValue: 0,
  			allowNull: false
  		},
      feeslends: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      deposits: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      depositstotal: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      withdrawals: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      withdrawalstotal: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      withdrawalsfee: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false
      },
      totalfees: {
        type: Sequelize.BIGINT,
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
