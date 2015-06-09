// Route definitions

var _ = require( 'lodash' );

var db = require( '../db' );

function addroutes( app, router )
{

	// Index
	router.get( '/', function( req, res )
	{
		db.Extension.findAndCountAll({
			order: [[ 'updatedAt', 'DESC' ]],
			limit: 10
		}).then( function( result ) {
			res.render( 'index', { extensions: result } );
		});
	});

	routemulti( router, 'admin', require( './controllers/admin.js' ) );
	routemulti( router, 'extensions', require( './controllers/extensions.js' ) );
	
	// Error handling
	app.use( function( err, req, res, next )
	{
		console.error( err.stack );
		return res.status( 500 ).render( 'error', {
			type: 'unhandlederror',
			stack: err.stack,
		});
	});

}

// Add RESTful routes for a resource controller
function routemulti( router, prefix, routes )
{
	routes.forEach( function( route )
	{
		// route = [ method, path, [func(s)] ]
		var path = '/' + prefix + ( route[1] ? '/' + route[1] : '' );
		if ( _.isArray( route[2] ) )
		{
			route[2].unshift( path );
		}
		else
		{
			route[2] = [ path, route[2] ];
		}
		router[ route[0] ].apply( router, route[2] );
	});
}

module.exports = {
	addroutes: addroutes,
	routemulti: routemulti,
};
