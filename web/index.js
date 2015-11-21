// Set up an Express web server

var compression = require( 'compression' );
var dateFilter = require( 'nunjucks-date-filter' );
var express = require( 'express' );
var nunjucks = require( 'nunjucks' );

var authentication = require( './authentication.js' );
var routes = require( './routes.js' );
var email = require( './email.js' );
var util = require( './util.js' );

var app = express();
var router = express.Router();
app.set( 'port', process.env.PORT || 3000 );

app.use( compression() );

// Set up templates using Nunjucks
app.set( 'view engine', 'html' );
var nunjucks_config = { express: app };
if ( process.env.NODE_ENV && process.env.NODE_ENV == 'development' )
{
	app.set( 'view cache', false );
	nunjucks_config.noCache = true;
}
var nunjucks_env = nunjucks.configure( __dirname + '/views', nunjucks_config );
dateFilter.install( nunjucks_env );

// Static files
app.use( '/static', express.static( './web/static', {} ) );

authentication.setup( app );

// Set session for the Public Library
app.use( function( req, res, next )
{
	if ( typeof req.query.pl != 'undefined' )
	{
		req.session.pl = req.query.pl;
	}
	res.locals.pl = req.session.pl;
	if ( req.session.extensions )
	{
		res.locals.showingexts = 1;
	}
	next();
});

app.use( router );

routes.addroutes( app, router );

email.setup();

exports.app = app;
exports.router = router;
exports.util = util;
