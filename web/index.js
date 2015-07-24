// Set up an Express web server

var compression = require( 'compression' );
var express = require( 'express' );
var swig = require( 'swig' );

var authentication = require( './authentication.js' );
var routes = require( './routes.js' );
var util = require( './util.js' );

var app = express();
var router = express.Router();
app.set( 'port', process.env.PORT || 3000 );

app.use( compression() );

// Set up templates using Swig
app.engine( 'html', swig.renderFile );
app.set( 'view engine', 'html' );
app.set( 'views', __dirname + '/views' );

if ( process.env.NODE_ENV && process.env.NODE_ENV == 'development' )
{
	app.set( 'view cache', false );
	swig.setDefaults({ cache: false });
}

app.use( '/static', express.static( './web/static', {} ) );

authentication.setup( app );

// Set session for the Public Library
app.use( function( req, res, next )
{
	if ( typeof req.query.pl != 'undefined' )
	{
		req.session.pl = res.locals.pl = req.query.pl;
	}
	next();
});

app.use( router );

routes.addroutes( app, router );

exports.app = app;
exports.router = router;
exports.util = util;
