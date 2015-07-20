/*

i7el - The Inform 7 Extensions Library
======================================

Copyright (c) 2015, The i7el team
MIT licenced
https://github.com/i7/i7el

*/

console.log( 'i7el: Starting up' );
var db = require( './db' );
var web = require( './web' );

var app = web.app;

console.log( 'i7el: Syncing database' );
db.sequelize.sync()
	.then( web.util.updatesettings )
	.then( function()
	{
		// Start the server!
		var server = app.listen( app.get( 'port' ), function()
		{
			console.log( 'i7el: Express server listening on port ' + app.get( 'port' ) );
		});
	});
