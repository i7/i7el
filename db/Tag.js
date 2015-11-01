module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Tag", {
		tag: {
			type: DataTypes.TEXT,
			// Force lowercase
			set: function( value )
			{
				this.setDataValue( 'tag', value.toLowerCase() );
			},
		},
	}, {
		timestamps: false,
	});
};
