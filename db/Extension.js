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
		/*
		// Additional data
		{
			// A list of maintainers
			maintainers: [],
			// I7 releases available for this extension
			i7releases: '6L38, 6G60',
			// Cached latest version number for each I7 release
			byRelease: { 6G60: '1/150101', },
			// Cached properties from the current version
			current: { version, i7releases, createdAt, updatedAt },
		}
		*/
		data: DataTypes.JSONB,
		// Approved for the public library
		approved: DataTypes.BOOLEAN,
		// Description and documentation in Markdown
		description: DataTypes.TEXT,
		documentation: DataTypes.TEXT,
	}, {
		defaultScope: {},
		scopes: {
			pl: { where: { approved: true } },
		},
		classMethods: {
			pl_scope: function( req )
			{
				if ( req.session.pl )
				{
					return this.scope( 'defaultScope', 'pl' );
				}
				return this;
			},
		},
		instanceMethods: {
			// Update the cached version data, returns a promise
			updateData: function( options )
			{
				options = options || {};
				var self = this;
				return this.getVersions({
					// Order by i7 releases then version number
					order: Version.orderByReleaseAndVersion,
					transaction: options.transaction,
				})
					.then( function( results )
					{
						var i7releases = [], byRelease = {};
						results.forEach( function( vers )
						{
							// Update i7releases and byRelease
							i7releases = i7releases.concat( vers.releasesToArray() );
							vers.releasesToArray().forEach( function( i7release )
							{
								if ( !byRelease[i7release] || ( +( vers.version.replace( '/', '.' ) ) > +( byRelease[i7release].replace( '/', '.' ) ) ) )
								{
									byRelease[i7release] = vers.version;
								}
							});
						});
						self.data.i7releases = _.uniq( i7releases ).sort().reverse().join( ', ' );
						self.data.byRelease = byRelease;
						
						// Check if the current version has changed
						var current = results[0],
						new_version = {
							version: current.version,
							i7releases: current.i7releases,
							createdAt: current.createdAt,
							updatedAt: current.updatedAt,
						};
						if ( JSON.stringify( new_version ) != JSON.stringify( self.data.current || {} ) )
						{
							self.data.current = new_version;
							self.updateDescription( current );
							self.updateDocumentation( current );
						}
						self.changed( 'data', true );
						return self.save({ transaction: options.transaction });
					});
			},
			// Extract description from the extension rubric
			updateDescription: function( current )
			{
				if ( !this.description )
				{
					var lines = current.code.split( /\r?\n/g ).slice( 1 );
					var description = '';
					// While the extension format is supposed to have one blank line followed by a rubric, support having any number of blank lines
					while ( _.trim( lines[0] ) == '' )
					{
						lines.shift();
					}
					if ( /^\s*"/.test( lines[0] ) )
					{
						// Handle multi-line rubrics
						while ( !/"\.?\s*$/.test( description ) )
						{
							description += lines.shift() + ' ';
						}
						this.description = _.trim( description, ' "' );
					}
				}
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
