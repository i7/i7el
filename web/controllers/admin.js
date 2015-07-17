// Admin controller

var _ = require( 'lodash' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var requireadmin = util.requirePermission( 'admin' );

function preparevars( req )
{
	var settings = req.app.locals.settings;
	return {
		admins: settings.admins.join( '\n' ),
		editors: settings.editors.join( '\n' ),
		releases: settings.releases.join( '\n' ),
	};
}

module.exports = function( router )
{

routes.routemulti( router, 'admin', [

[ 'get', '', [ requireadmin, function index( req, res )
	{
		util.updatesettings()
			.then( function()
			{
				res.render( 'admin', preparevars( req ) );
			});
	} 
] ],
	
[ 'post', '', [ requireadmin, urlencodedParser, function update( req, res )
	{
		function normifyresults( data )
		{
			return _( data || '' ).split( '\r\n' ).map( _.trim ).filter().sort().value();
		}
	
		var settings = req.app.locals.settings;
		settings.admins = normifyresults( req.body.admins );
		settings.editors = normifyresults( req.body.editors );
		settings.releases = normifyresults( req.body.releases ).reverse();
		
		db.Setting.findOne({ where: { key: 'core' } })
			.then( function( result )
			{
				return result.update({ value: JSON.stringify( settings ) });
			})
			.then( function()
			{
				var templatevars = preparevars( req );
				templatevars.saved = 1;
				res.render( 'admin', templatevars );
			});
	}
] ],

] );

};
