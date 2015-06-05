// Pad a version number
function padversion( version )
{
	return ( '00' + version ).substr( -10 );
}

module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Version", {
		version: {
			type: DataTypes.TEXT,
			// Force the stored version number to be 3 digits so that sorting will work correctly.
			// Note that searches for particular versions must use padded version numbers
			get: function()
			{
				return this.getDataValue( 'version' ).replace( /^0+/, '' );
			},
			set: function( value )
			{
				this.setDataValue( 'version', padversion( value ) );
			},
		},
		code: DataTypes.TEXT,
		i7versions: DataTypes.ARRAY( DataTypes.TEXT ),
		// Email address of uploader
		uploader: DataTypes.TEXT,
	}, {
		classMethods: {
			padversion: padversion,
		},
	});
};
