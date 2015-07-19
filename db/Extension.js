var _ = require( 'lodash' );

module.exports = function( sequelize, DataTypes )
{
	var Version = sequelize.models.Version;
	
	return sequelize.define( "Extension", {
		slug: {
			type: DataTypes.TEXT,
			unique: true,
		},
		title: DataTypes.TEXT,
		author: DataTypes.TEXT,
		// A stored copy of some relevant properties of the current version (but not the code itself)
		// Properties: version, i7releases, updatedAt
		current: DataTypes.JSON,
		// Maintainer email address
		maintainer: DataTypes.TEXT,
		// Approved for the public library
		approved: DataTypes.BOOLEAN,
		// Description and documentation in Markdown
		description: DataTypes.TEXT,
		documentation: DataTypes.TEXT,
		// categories/tags
	}, {
		defaultScope: {},
		instanceMethods: {
			updateSchema: function() {},
			// Update the current version, and run some other update functions if it's changed
			updateCurrentVersion: function( callback, transaction )
			{
				var self = this;
				var old_version = JSON.stringify( this.current || {} );
				this.getVersions({
					// Order by i7 releases then version number
					order: Version.orderByReleaseAndVersion,
					limit: 1,
					raw: 1,
					transaction: transaction,
				})
					.then( function( results )
					{
						var current = results[0];
						var new_version = {
							version: current.version,
							i7releases: current.i7releases,
							updatedAt: current.updatedAt,
						};
						var changed = JSON.stringify( new_version ) != old_version;
						if ( changed )
						{
							self.current = new_version;
							self.updateDescription( current );
							self.updateDocumentation( current );
						}
						callback( changed );
					});
			},
			// Extract description from the extension rubric
			updateDescription: function( current )
			{
			},
			// Extract documenation
			updateDocumentation: function( current )
			{
				var docs = current.code.match( /-{3,} +DOCUMENTATION +-{3,}([\s\S]+$)/i );
				if ( docs )
				{
					this.documentation = _.trim( docs[1] );
				}
			},
		},
	});
};
