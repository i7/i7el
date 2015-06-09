// Route definitions

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

	require( './controllers/admin.js' )( router );
	require( './controllers/extensions.js' )( router );
	
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
		var path = ( prefix ? '/' + prefix : '' ) + ( route[1] ? '/' + route[1] : '' );
		router[ route[0] ]( path, route[2] );
	});
}

module.exports = {
	addroutes: addroutes,
	routemulti: routemulti,
};
