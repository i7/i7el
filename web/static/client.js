/*

i7el - The Inform 7 Extensions Library
======================================

Client interface

Copyright (c) 2015, The i7el team
MIT licenced
https://github.com/i7/i7el

*/

// Handle events for the i7releases selector
$( function()
{
	// Toggle the warning
	var form = $( 'form[data-i7releases="on"]' ),
	warning = form.find( '.releases-warning' ),
	submit = form.find( 'button' ),
	warned = form.find( 'input:checked' ).length == 0;
	form.on( 'click change', 'input:checkbox', function()
	{
		var warn = form.find( 'input:checked' ).length == 0;
		if ( warn != warned )
		{
			warned = warn;
			warning.toggle();
			submit.toggleClass( 'btn-warning btn-default' );
		}
	});
});
