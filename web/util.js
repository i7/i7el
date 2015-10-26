// Util functions

var _ = require( 'lodash' );
var speakingurl = require( 'speakingurl' );

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

// Middleware for showing an alert if one has been stored in session
function showalert( req, res, next )
{
	if ( req.session.alert )
	{
		res.locals.alert = req.session.alert;
		delete req.session.alert;
	}
	next();
}

// Create URL slugs for extensions
function slug( title, author )
{
	title = _.trim( title ).replace( /\s+/g, ' ' );
	author = _.trim( author ).replace( /\s+/g, ' ' );
	return speakingurl( title + ' by ' + author );
}

module.exports = {
	requirePermission: requirePermission,
	showalert: showalert,
	slug: slug,
};
