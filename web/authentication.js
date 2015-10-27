// Authentication using Passport and Google OpenID Connect

var _ = require( 'lodash' );
var GoogleStrategy = require( 'passport-google-oauth' ).OAuth2Strategy;
var passport = require( 'passport' );
var session = require( 'express-session' );
var FileStore = require( 'session-file-store' )( session );

var db = require( '../db' );
var core_settings;

function setup( app )
{
	core_settings = db.core_settings;

	// Sessions
	app.use( session({
		resave: false,
		saveUninitialized: false,
		cookie: { secure: 'auto' },
		secret: core_settings.get( 'sessionsecret' ),
		store: new FileStore({
			path: './.sessions',
		}),
	}) );

	app.use( passport.initialize() );
	app.use( passport.session() );
	
	// Set up Passport
	var oauth_settings = core_settings.get( 'google' );
	passport.use( new GoogleStrategy( {
			clientID: oauth_settings.key,
			clientSecret: oauth_settings.secret,
			callbackURL: process.env.SITE_URL + 'login/return',
		},
		function( accessToken, refreshToken, profile, done )
		{
			done( null, new User( app, profile ) );
		}) );

	passport.serializeUser( function( user, done )
	{
		done( null, { displayName: user.displayName, email: user.email } );
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
	
	app.get( '/login', passport.authenticate( 'google', { scope: 'email' } ) );
	app.get( '/login/return', passport.authenticate( 'google' ), returnFromGoogle );
	app.get( '/logout', function( req, res, next )
	{
		req.logout();
		next();
	}, returnFromGoogle );
	
	// Give the templates the user info
	app.use( function( req, res, next )
	{
		// Skip the favicon
		if ( !/\.\w+$/.test( req.path ) )
		{
			res.locals.user = req.user;
			// Store the current page for when the user logs in or out
			req.session.returnTo = _.trim( req.originalUrl, '#' );
		}
		next();
	});

}

// User objects
function User( app, profile )
{
	this.app = app;
	this.displayName = profile.displayName;
	this.email = profile.email || profile.emails[0].value;
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
	if ( _.includes( core_settings.get( 'admins' ), this.email ) )
	{
		return 1;
	}

	// Should add a ban list...
	
	// For now only editors can create new extensions
	if ( _.includes( core_settings.get( 'editors' ), this.email ) )
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
