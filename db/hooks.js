function add_hooks( db )
{
	
	// After updating a Version, update the corresponding Extension so that it has the correct CurrentVersion
	function update_CurrentVersion( instance, options, callback )
	{
		db.Version.findOne({
			where: {
				ExtensionId: instance.ExtensionId,
			},
			// TODO account for i7versions
			order: [[ 'version', 'DESC' ]],
		})
			.then( function( current_version )
			{
				return db.Extension.update(
					{ CurrentVersionId: current_version.id },
					{ where: { id: instance.ExtensionId } }
				);
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
