// Route definitions

var _ = require( 'lodash' );

function addroutes( app, router )
{
	require( './controllers/indexes.js' )( router );
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
		var path = _.isRegExp( route[1] ) ?
			route[1] :
			( prefix ? '/' + prefix : '' ) + ( route[1] ? '/' + route[1] : '' );
		router[ route[0] ]( path, route[2] );
	});
}

module.exports = {
	addroutes: addroutes,
	routemulti: routemulti,
};
