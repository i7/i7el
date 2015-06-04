// Admin controller

var _ = require( 'lodash' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });

var db = require( '../../db' );
var util = require( '../util.js' );

function requireadmin( req, res, next )
{
	if ( req.user && req.user.can( 'admin' ) )
	{
		return next();
	}
	return res.status( 403 ).render( 'error', { type: 'authentication' } );
}

function preparevars( req )
{
	var settings = req.app.locals.settings;
	return {
		admins: settings.admins.join( '\n' ),
		editors: settings.editors.join( '\n' ),
		versions: settings.versions.join( '\n' ),
	};
}

module.exports = [

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
				return _.map( data.split( '\r\n' ), _.trim ).filter( _.identity );
			}
		
			var settings = req.app.locals.settings;
			settings.admins = normifyresults( req.body.admins );
			settings.editors = normifyresults( req.body.editors );
			settings.versions = normifyresults( req.body.versions );
			
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

];
