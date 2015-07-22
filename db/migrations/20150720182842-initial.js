// Initial database structure

module.exports = {
	up: function ( migration, DataTypes )
	{
		return migration.createTable( 'Settings', {
			key: {
				type: DataTypes.TEXT,
				primaryKey: true,
     			allowNull: false,
			},
			value: DataTypes.TEXT,
		})
			.then( function() {
				return migration.createTable( 'Extensions', {
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
					slug: {
						type: DataTypes.TEXT,
						unique: true,
					},
					title: DataTypes.TEXT,
					author: DataTypes.TEXT,
					current: DataTypes.JSON,
					maintainer: DataTypes.TEXT,
					approved: DataTypes.BOOLEAN,
					description: DataTypes.TEXT,
					documentation: DataTypes.TEXT,
				});
			})
			.then( function() {
				return migration.createTable( 'Versions', {
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
					version: DataTypes.TEXT,
					code: DataTypes.TEXT,
					i7releases: DataTypes.TEXT,
					uploader: DataTypes.TEXT,
					ExtensionId: {
						type: DataTypes.INTEGER,
						references: "Extensions",
						referencesKey: "id",
					},
				});
			});
	},

	down: function ( migration, DataTypes )
	{
		return migration.dropTable( 'Settings' )
			.then( function() {
				return migration.dropTable( 'Versions' );
			})
			.then( function() {
				return migration.dropTable( 'Extensions' );
			});
	}
};
