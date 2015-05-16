module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Version", {
		version: {
			type: DataTypes.TEXT,
			// Force the stored version number to be 3 digits so that sorting will work correctly.
			get: function()
			{
				return this.getDataValue( 'version' ).replace( /^0+/, '' );
			},
			set: function( value )
			{
				this.setDataValue( 'version', ( '00' + value ).substr( -10 ) );
			},
		},
		code: DataTypes.TEXT,
		i7versions: DataTypes.ARRAY( DataTypes.TEXT ),
		uploader: DataTypes.TEXT,
	});
};
