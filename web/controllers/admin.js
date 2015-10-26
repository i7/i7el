// Admin controller

var _ = require( 'lodash' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var requireadmin = util.requirePermission( 'admin' );
var showalert = util.showalert;

var core_settings = db.core_settings;

function preparevars( req )
{
	return {
		admins: core_settings.get( 'admins' ).join( '\n' ),
		editors: core_settings.get( 'editors' ).join( '\n' ),
		releases: core_settings.get( 'releases' ).join( '\n' ),
		settings: core_settings,
		current: 'settings',
	};
}

module.exports = function( router )
{

routes.routemulti( router, 'admin', [

[ 'get', '', [ requireadmin, function index( req, res )
	{
		res.render( 'admin-settings', preparevars( req ) );
	}
] ],
	
[ 'post', '', [ requireadmin, urlencodedParser, function update( req, res )
	{
		function normifyresults( data )
		{
			return _( data || '' ).split( '\r\n' ).map( _.trim ).filter().sort().value();
		}
		
		core_settings.set( 'admins', normifyresults( req.body.admins ) );
		core_settings.set( 'editors', normifyresults( req.body.editors ) );
		core_settings.set( 'releases', normifyresults( req.body.releases ).reverse() );
		core_settings.set( 'sessionsecret', req.body.sessionsecret );
		core_settings.set( 'google', {
			key: req.body.googlekey,
			secret: req.body.googlesecret,
		});
		
		var templatevars = preparevars( req );
		templatevars.saved = 1;
		res.render( 'admin-settings', templatevars );
	}
] ],

[ 'get', 'tools', [ requireadmin, showalert, function tools( req, res )
	{
		if ( req.query.method == 'update' )
		{
			db.Extension.findAll()
				.then( function( results )
				{
					_.forEach( results, function( ext )
					{
						ext.updateData();
					});
				});
			req.session.alert = {
				type: 'Success',
				msg: 'Extensions are in the process of being updated now',
			};
			res.redirect ( '/admin/tools' );
		}
		else
		{
			var data = { current: 'tools' };
			res.render( 'admin-tools', data );
		}
	}
] ],

] );

};
