// Util functions

var _ = require( 'lodash' );

var db = require( '../db' );
var web = require( './index.js' );

// Function to update settings from the db
function updatesettings()
{
	var app = web.app;
	return db.Setting.findOne({ where: { key: 'core' } })
		.then( function( results )
		{
			// Store core settings
			app.locals.settings = {
				admins: [],
				editors: [],
				versions: [],
			};
			if ( results )
			{
				_.merge( app.locals.settings, JSON.parse( results.value ) );
			}
			return results;
		} );
}

module.exports = {
    updatesettings: updatesettings,
};
