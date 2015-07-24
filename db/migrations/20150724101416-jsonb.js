// Swap from current::json to data::jsonb
// Remove the maintainer prop as it will be stored in data now

module.exports = {
	up: function ( migration, DataTypes )
	{
		return migration.addColumn( 'Extensions', 'data', {
				type: DataTypes.JSONB,
	 			defaultValue: {},
			})
			.then( function() {
				return migration.removeColumn( 'Extensions', 'current' );
			})
			.then( function() {
				return migration.removeColumn( 'Extensions', 'maintainer' );
			});
	},

	down: function ( migration, DataTypes )
	{
		return migration.addColumn( 'Extensions', 'current', DataTypes.JSON )
			.then( function() {
				return migration.addColumn( 'Extensions', 'maintainer', DataTypes.TEXT );
			})
			.then( function() {
				return migration.removeColumn( 'Extensions', 'data' );
			});
	}
};
