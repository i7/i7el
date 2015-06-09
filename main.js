/*

i7el - The Inform 7 Extensions Library
======================================

Copyright (c) 2015, The i7el team
ISC licenced
https://github.com/i7/i7el

*/

var db = require( './db' );
var web = require( './web' );

var app = web.app;

db.sequelize.sync()
	.then( web.util.updatesettings )
	.then( function()
	{
		// Start the server!
		var server = app.listen( app.get( 'port' ), function()
		{
			console.log( 'Express server listening on port ' + app.get( 'port' ) );
		});
	});
