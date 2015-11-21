// Admin controller

var _ = require( 'lodash' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });

var db = require( '../../db' );
var routes = require( '../routes.js' );
var email = require( '../email.js' );
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
		core_settings.set( 'upload_limit', req.body.upload_limit );
		core_settings.set( 'sessionsecret', req.body.sessionsecret );
		core_settings.set( 'postmark', req.body.postmark );
		core_settings.set( 'sender', req.body.sender );
		core_settings.set( 'google', {
			key: req.body.googlekey,
			secret: req.body.googlesecret,
		});
		
		var templatevars = preparevars( req );
		templatevars.saved = 1;
		res.render( 'admin-settings', templatevars );
	}
] ],

[ 'get', 'approvals', [ requireadmin, showalert, function getApprovalRequests( req, res )
	{
		db.Request.findAll({
			where: { maintainership: false },
			include: [ db.Extension ],
			order: [[ 'createdAt', 'ASC' ]],
		})
			.then( function( results )
			{
				var data = {
					requests: results,
					current: 'approvals',
				};
				res.render( 'admin-approvals', data );
			});
	}
] ],

[ 'post', 'approvals', [ requireadmin, urlencodedParser, function approveExts( req, res )
	{
		var msg, promises = [];
		
		db.Request.findOne({
			where: { id: req.body.id },
			include: [ db.Extension ],
		})
			.then( function( request )
			{
				if ( +req.body.approve )
				{
					request.Extension.approved = true;
					promises.push( request.Extension.save() );
					msg = request.Extension.fullTitle() + ' approved for the Public Library';
					
					promises.push( email.send({
						template: 'email-extension-approval.html',
						to: request.requester,
						subject: request.Extension.fullTitle() + ' has been approved!',
						tag: 'PublicLibraryApprovalRequest',
						extension: request.Extension,
					}) );
				}
				else
				{
					msg = request.Extension.fullTitle() + ' has not been approved for the Public Library';
				}
				promises.push( request.destroy() );
				
				Promise.all( promises )
					.then( function()
					{
						req.session.alert = {
							type: 'Success',
							msg: msg,
						};
						res.redirect ( '/admin/approvals' );
					})
					// TODO generalise these errors...
					.catch( function( err )
					{
						console.error( err.stack );
					});
			});
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
