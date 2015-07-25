function add_hooks( db )
{
	
	// After updating a Version, update the corresponding Extension
	function update_CurrentVersion( instance, options )
	{
		return instance.getExtension()
			.then( function( ext )
			{
				return ext.updateData( options );
			});
	}
	
	db.Version.addHook( 'afterCreate', 'update_CurrentVersion', update_CurrentVersion );
	db.Version.addHook( 'afterUpdate', 'update_CurrentVersion', update_CurrentVersion );
	
}

module.exports = add_hooks;
