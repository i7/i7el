// Add the extension/maintainership requests and tags tables

module.exports = {
	up: function ( migration, DataTypes )
	{
		return migration.createTable( 'Tags', {
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
	 			allowNull: false,
			},
			tag: {
				type: DataTypes.TEXT,
			},
			ExtensionId: {
				type: DataTypes.INTEGER,
				references: {
					model: "Extensions",
					key: "id",
				},
				onDelete: 'CASCADE',
			},
		})
			.then( function() {
				return migration.createTable( 'Requests', {
					id: {
						type: DataTypes.INTEGER,
						primaryKey: true,
						autoIncrement: true,
			 			allowNull: false,
					},
					createdAt: {
						type: DataTypes.DATE,
			 			allowNull: false,
					},
					updatedAt: {
						type: DataTypes.DATE,
			 			allowNull: false,
					},
					maintainership: DataTypes.BOOLEAN,
					requester: DataTypes.JSONB,
					message: DataTypes.TEXT,
					emailed: DataTypes.JSONB,
					ExtensionId: {
						type: DataTypes.INTEGER,
						references: {
							model: "Extensions",
							key: "id",
						},
						onDelete: 'CASCADE',
					},
			});
		});
	},

	down: function ( migration, DataTypes )
	{
		return migration.dropTable( 'Tags' )
			.then( function() {
				return migration.dropTable( 'Requests' );
			});
	}
};
