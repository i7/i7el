// Util functions

var _ = require( 'lodash' );
var speakingurl = require( 'speakingurl' );

var db = require( '../db' );
var web = require( './index.js' );

// Generate a middleware for permissions
function requirePermission( permission )
{
	return function( req, res, next )
	{
		if ( req.user && req.user.can[ permission ] )
		{
			return next();
		}
		return res.status( 403 ).render( 'error', { type: 'authentication' } );
	};
}

// Create URL slugs for extensions
function slug( title, author )
{
	return speakingurl( title + ' by ' + author );
}

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
				releases: [],
			};
			if ( results )
			{
				_.merge( app.locals.settings, JSON.parse( results.value ) );
			}
			return results;
		} );
}

module.exports = {
	requirePermission: requirePermission,
	slug: slug,
    updatesettings: updatesettings,
};
