'use strict';
module.exports = (sequelize, DataTypes) => {
	var Transaction = sequelize.define('Transaction', {
		address: {
			type: DataTypes.STRING,
			allowNull: false
		},
		type: {
			type: DataTypes.STRING,
		},
		txid: {
			type: DataTypes.STRING,
			unique: true
		},
		coin: {
			type: DataTypes.STRING
		},
		value: {
			type: DataTypes.STRING
		},
		confirmations: {
			type: DataTypes.INTEGER
		},
		confirmed: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		owner: {
			type: DataTypes.STRING,
		}
	});

	return Transaction;
};
