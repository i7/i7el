// Check for outdated extensions

var _ = require( 'lodash' );
var jsonParser = require( 'body-parser' ).json();
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

function categorise_exts( extensions )
{
	var results = {
		update: [],
		downgrade: [],
		uptodate: [],
	};
	
	_.forEach( extensions, function( ext )
	{
		var uptodate = true,
		versions = ext.versions;
		
		if ( versions.current > versions.shared || versions.current > versions.project )
		{
			results.update.push( ext );
			uptodate = false;
		}
		if ( versions.current < versions.shared || versions.current < versions.project )
		{
			results.downgrade.push( ext );
			uptodate = false;
		}
		if ( uptodate )
		{
			results.uptodate.push( ext );
		}
	});
	
	results.update = _.sortBy( results.update, 'slug' );
	results.downgrade = _.sortBy( results.downgrade, 'slug' );
	results.uptodate = _.sortBy( results.uptodate, 'slug' );
	return results;
}

module.exports = function( router )
{

routes.routemulti( router, 'outdated', [

[ 'post', '', [ jsonParser, urlencodedParser, function outdated( req, res )
	{
		var postdata;
		
		// Try to handle JSON submitted both as the whole body, and as a urlencoded value
		if ( req.body.release )
		{
			postdata = req.body;
		}
		else if ( req.body.json )
		{
			try
			{
				postdata = JSON.parse( req.body.json )
			}
			catch (e)
			{
			}
		}
		
		// Bad data
		if ( !postdata || !postdata.release )
		{
			return res.status( 400 ).render( 'error', { msg: 'Invalid extension data' } );
		}
		
		// Save the release
		req.session.pl = postdata.release;
		res.locals.pl = postdata.release;
		
		// Process the extensions
		var extensions = {},
		slugs = [];
		_.forEach( postdata.extensions, function( ext )
		{
			ext.slug = util.slug( ext.title, ext.author );
			slugs.push( ext.slug );
			extensions[ ext.slug ] = ext;
		});
		
		db.Extension.findAll({
			where: {
				slug: { $in: slugs },
			},
			raw: true,
		})
			.then( function( results )
			{
				var project = false;
				
				// Go through and process the version numbers
				_.forEach( results, function( data )
				{
					var ext = extensions[ data.slug ];
					ext.current = ( data.data.i7releases || '').indexOf( postdata.release ) >= 0 && data.data.current.version;
					ext.versions = { current: +( ext.current.replace( '/', '.' ) ) };
					if ( ext.shared )
					{
						ext.versions.shared = +( ext.shared.replace( '/', '.' ) );
					}
					if ( ext.project )
					{
						ext.versions.project = +( ext.project.replace( '/', '.' ) );
						project = true;
					}
				});
				// Filter out extensions the i7el doesn't have
				extensions = _.filter( extensions, 'versions' );
				
				req.session.extensions = extensions;
				var data = {
					extensions: categorise_exts( extensions ),
					project: project,
				};
				res.render( 'outdated', data );
			});
	}
] ],

[ 'get', '', [ jsonParser, urlencodedParser, function outdatedAgain( req, res )
	{
		var extensions = req.session.extensions,
		project = false;
		
		if ( !extensions )
		{
			return res.status( 400 ).render( 'error', { msg: 'No extension data' } );
		}
		
		_.forEach( extensions, function( ext )
		{
			if ( ext.project )
			{
				project = true;
			}
		});
		
		var data = {
			extensions: categorise_exts( extensions ),
			project: project,
		};
		
		res.render( 'outdated', data );
	}
] ],

] );

};
