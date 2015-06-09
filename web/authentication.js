// Authentication using Passport and Google OpenID Connect

var _ = require( 'lodash' );
var GoogleStrategy = require( 'passport-google-openidconnect' ).Strategy;
var passport = require( 'passport' );
var session = require( 'express-session' );
var FileStore = require( 'session-file-store' )( session );

function setup( app )
{

	// Sessions
	app.use( session({
		resave: false,
		saveUninitialized: false,
		secret: process.env.APP_SECRET,
		store: new FileStore({
			path: './.sessions',
		}),
	}) );

	app.use( passport.initialize() );
	app.use( passport.session() );

	// Set up Passport
	var OAUTH_SETTINGS = JSON.parse( process.env.OAUTH_SETTINGS );
	OAUTH_SETTINGS.scope = 'email';

	passport.use( new GoogleStrategy( OAUTH_SETTINGS, function( accessToken, refreshToken, profile, done )
	{
		done( null, new User( app, profile._json.email ) );
	}) );

	passport.serializeUser( function( user, done )
	{
		done( null, user.email );
	});
	passport.deserializeUser( function( id, done )
	{
		done( null, new User( app, id ) );
	});

	// Routes for logging in and out
	function returnFromGoogle( req, res )
	{
		var path = req.session.returnTo || '/';
		req.session.returnTo = null;
		res.redirect( path );
	}
	
	app.get( '/login', passport.authenticate( 'google-openidconnect' ) );
	app.get( '/login/return', passport.authenticate( 'google-openidconnect' ), returnFromGoogle );
	app.get( '/logout', function( req, res, next )
	{
		req.logout();
		next();
	}, returnFromGoogle );
	
	// Give the templates the user info
	app.use( function( req, res, next )
	{
		res.locals.user = req.user;
		// Store the current page for when the user logs in or out
		req.session.returnTo = req.path;
		next();
	});

}

// User objects
function User( app, email )
{
	this.app = app;
	this.email = email;
	this.can = {};
	
	// Fill out the permissions
	var i = 0, actions = [ 'admin', 'create', 'editany' ];
	for ( ; i < actions.length ; i++ )
	{
		this.can[ actions[i] ] = this.testpermission( actions[i] );
	}
}

User.prototype.testpermission = function( action )
{
	// Admins can do all
	if ( _.includes( this.app.locals.settings.admins, this.email ) )
	{
		return 1;
	}

	// Should add a ban list...
	
	// For now only editors can create new extensions
	if ( _.includes( this.app.locals.settings.editors, this.email ) )
	{
		if ( [ 'create', 'editany', 'editthis' ].indexOf( action ) >= 0 )
		{
			return 1;
		}
	}
	return 0;
};

module.exports = {
	setup: setup,
};
