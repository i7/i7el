module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Setting", {
		key: DataTypes.TEXT,
		value: DataTypes.TEXT,
	}, {
		timestamps: false,
	});
};
