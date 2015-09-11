// Route definitions

var db = require( '../db' );

function addroutes( app, router )
{
	// Index and search
	require( './controllers/search.js' )( router );
	require( './controllers/admin.js' )( router );
	require( './controllers/extensions.js' )( router );
	require( './controllers/outdated.js' )( router );
	
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
