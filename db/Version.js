var _ = require( 'lodash' );

module.exports = function( sequelize, DataTypes )
{
	var orderByI7Release = [ sequelize.fn( 'substr', sequelize.col( 'i7releases' ), 0, 4 ), 'DESC NULLS LAST' ];
	var orderByVersion = [ sequelize.cast( sequelize.fn( 'replace', sequelize.col( 'version' ), '/', '.' ), 'decimal' ), 'DESC' ];

	return sequelize.define( "Version", {
		version: DataTypes.TEXT,
		code: DataTypes.TEXT,
		// A comma and space separated list of I7 releases
		i7releases: {
			type: DataTypes.TEXT,
			// Normalise input, takes an array of strings
			set: function( releases )
			{
				if ( releases )
				{
					releases = _.isArray( releases ) ? releases : [ releases ];
					releases = _( releases ).map( _.trim ).filter().sort().reverse().join( ', ' );
				}
				releases = releases || null;
				this.setDataValue( 'i7releases', releases );
			},
		},
		// Email address of uploader
		uploader: DataTypes.TEXT,
	}, {
		defaultScope: {
			// By default sort by only the version number, not i7releases
			order: [ orderByVersion ],
		},
		classMethods: {
			orderByReleaseAndVersion: [ orderByI7Release, orderByVersion ],
		},
		instanceMethods: {
			stable: function()
			{
				return new Date() - new Date( this.createdAt ) > 86400000;
			},
			releasesToArray: function()
			{
				var releases = this.getDataValue( 'i7releases' );
				return releases ? releases.split( ', ' ) : [];
			},
		},
	});
};
