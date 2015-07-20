function add_hooks( db )
{
	
	// After updating a Version, update the corresponding Extension so that it has the correct CurrentVersion
	function update_CurrentVersion( instance, options, callback )
	{
		var transaction = options.transaction;
		instance.getExtension()
			.then( function( ext )
			{
				ext.updateCurrentVersion( function( result )
				{
					if ( result[0] )
					{
						ext.save({ transaction: transaction })
							.then( function() { callback(); } );
					}
					else
					{
						callback();
					}
				}, transaction );
			});
	}
	
	db.Version.addHook( 'afterCreate', 'update_CurrentVersion', update_CurrentVersion );
	db.Version.addHook( 'afterUpdate', 'update_CurrentVersion', update_CurrentVersion );
	
}

module.exports = add_hooks;
