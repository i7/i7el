var _ = require( 'lodash' );

function add_hooks( db )
{
	
	// After updating a Version, update the corresponding Extension so that it has the correct CurrentVersion
	function update_CurrentVersion( instance, options, callback )
	{
		db.Version.findOne({
			where: {
				ExtensionId: instance.ExtensionId,
			},
			// Default scope ordering is used to pick the latest version
			transaction: options.transaction,
		})
			.then( function( current_version )
			{
				var data = { currentVersion: current_version.version };
				
				// Extract documenation
				var docs = current_version.code.match( /-{3,} +DOCUMENTATION +-{3,}([\s\S]+$)/i );
				if ( docs )
				{
					data.documentation = _.trim( docs[1] );
				}
		
				return db.Extension.update( data, {
					where: { id: instance.ExtensionId },
					transaction: options.transaction,
				});
			})
			.then( function()
			{
				callback();
			});
	}
	
	db.Version.addHook( 'afterCreate', 'update_CurrentVersion', update_CurrentVersion );
	db.Version.addHook( 'afterUpdate', 'update_CurrentVersion', update_CurrentVersion );
	
}

module.exports = add_hooks;
