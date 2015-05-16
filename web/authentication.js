// Authentication using Passport and Google OpenID Connect

var _ = require( 'lodash' );

function setup( app, router )
{

	var GoogleStrategy = require( 'passport-google-openidconnect' ).Strategy;
	var passport = require( 'passport' );
	var session = require( 'express-session' );

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
		done( null, profile._json.email );
	}) );

	passport.serializeUser( function( user, done )
	{
		done( null, user );
	});
	passport.deserializeUser( function( id, done )
	{
		done( null, id );
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

function checkpermissions( user, userlist )
{
	if ( user && _.includes( userlist, user ) )
	{
		return 1;
	}
}

function checkpermissionsmiddleware( req, res, next, userlist )
{
	if ( checkpermissions( req.user, userlist ) )
	{
		return next();
	}
	return res.status( 403 ).render( 'error', { type: 'authentication' } );
}

function checkadmin( req, res, next )
{
	checkpermissionsmiddleware( req, res, next, req.app.locals.settings.admins );
}

function checkeditor( req, res, next )
{
	checkpermissionsmiddleware( req, res, next, req.app.locals.settings.editors );
}

module.exports = {
	setup: setup,
	checkadmin: checkadmin,
	checkeditor: checkeditor,
};
