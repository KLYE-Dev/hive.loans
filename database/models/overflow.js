'use strict';
module.exports = (sequelize, DataTypes) => {
  	var Overflow = sequelize.define('Overflow', {
	  	  coin: {
	        type: DataTypes.STRING
	      },
	      amount: {
	        type: DataTypes.STRING
	      },
	      finished: {
	        type: DataTypes.BOOLEAN
	      },
	      createdAt: {
	        allowNull: false,
	        type: DataTypes.DATE,
	        defaultValue: DataTypes.NOW
	      },
	      updatedAt: {
	        allowNull: false,
	        type: DataTypes.DATE,
	        defaultValue: DataTypes.NOW
	      }
	});

  	return Overflow;
};


