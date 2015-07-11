module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Version", {
		version: DataTypes.TEXT,
		code: DataTypes.TEXT,
		// A space separated list of I7 versions
		i7versions: DataTypes.TEXT,
		// Email address of uploader
		uploader: DataTypes.TEXT,
	}, {
		instanceMethods:
		{
			stable: function()
			{
				return new Date() - new Date( this.createdAt ) > 86400000;
			},
		},
	});
};
