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
			transaction: options.transaction,
		})
			.then( function( current_version )
			{
				return db.Extension.update(
					{
						currentVersion: current_version.version,
					},
					{
						where: { id: instance.ExtensionId },
						transaction: options.transaction,
					}
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
