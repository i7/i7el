// Authentication using Passport and Google OpenID Connect

var _ = require( 'lodash' );
var GoogleStrategy = require( 'passport-google-openidconnect' ).Strategy;
var passport = require( 'passport' );
var session = require( 'express-session' );

function setup( app, router )
{

	// Sessions
	app.use( session({
		resave: false,
		saveUninitialized: false,
		secret: process.env.APP_SECRET,
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
	
	// Give the templates the user info
	app.use( function( req, res, next )
	{
		res.locals.user = req.user;
		next();
	});

	// Routes for logging in and out
	router.get( '/login', passport.authenticate( 'google-openidconnect' ) );
	router.get( '/login/return', passport.authenticate( 'google-openidconnect', {
		failureRedirect: '/',
		successRedirect: '/',
	}) );
	router.get( '/logout', function( req, res )
	{
		req.logout();
		res.redirect( '/' );
	});

}

// User objects
function User( app, email )
{
	this.app = app;
	this.email = email;
}

User.prototype.can = function( action, data )
{
	// Admins can do all
	if ( _.includes( this.app.locals.settings.admins, this.email ) )
	{
		return 1;
	}

	// Should add a ban list...
	
	// For now only editors can create new extensions
	if ( action == 'create' && _.includes( this.app.locals.settings.editors, this.email ) )
	{
		return 1;
	}
};

module.exports = {
	setup: setup,
};
