'use strict';
module.exports = (sequelize, DataTypes) => {
	var Address = sequelize.define('Address', {
		coin: {
			type: DataTypes.STRING,
			unique: 'coinAddressIndex'
		},
		address: {
			type: DataTypes.STRING,
			unique: 'coinAddressIndex'
		},
		owner: {
			type: DataTypes.STRING,
		}
	});

	return Address;
};
