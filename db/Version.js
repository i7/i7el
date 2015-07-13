module.exports = function( sequelize, DataTypes )
{
	// Create an array of order parameters
	function make_order( sort_i7 )
	{
		var ret = [];
		if ( sort_i7 )
		{
			// Sort by i7releases with nulls last
			ret.push( sequelize.literal( "NULLIF( substr( i7releases, 0, 4 ), '' ) DESC NULLS LAST" ) );
		}
		ret.push( sequelize.literal( "replace( version, '/', '.' )::decimal DESC" ) );
		return ret;
	}

	return sequelize.define( "Version", {
		version: DataTypes.TEXT,
		code: DataTypes.TEXT,
		// A space separated list of I7 releases
		i7releases: DataTypes.TEXT,
		// Email address of uploader
		uploader: DataTypes.TEXT,
	}, {
		defaultScope: {
			// By default sort by only the version number, not i7releases
			order: make_order(),
		},
		classMethods: {
			order: make_order,
		},
		instanceMethods: {
			stable: function()
			{
				return new Date() - new Date( this.createdAt ) > 86400000;
			},
		},
	});
};
