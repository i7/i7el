module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Setting", {
		key: {
			type: DataTypes.TEXT,
			primaryKey: true,
		},
		value: DataTypes.TEXT,
	}, {
		timestamps: false,
	});
};
