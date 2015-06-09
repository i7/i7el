module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Version", {
		version: {
			// Store the version number as a decimal number
			type: DataTypes.DECIMAL,
			get: function()
			{
				return this.getDataValue( 'version' ).replace( '.', '/' );
			},
			set: function( value )
			{
				this.setDataValue( 'version', value.replace( '/', '.' ) );
			},
		},
		code: DataTypes.TEXT,
		i7versions: DataTypes.TEXT,
		// Email address of uploader
		uploader: DataTypes.TEXT,
	}, {
		hooks: {
			beforeFind: function( options, callback )
			{
				if ( options.where && options.where.version )
				{
					options.where.version = options.where.version.replace( '/', '.' );
				}
				callback();
			},
		},
	});
};
