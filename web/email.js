// Emails using Postmark

var _ = require( 'lodash' );
var Promise = require( 'bluebird' );
var juice = require( 'juice' );
var nunjucks = require( 'nunjucks' );
var postmark = require( 'postmark' );

var db = require( '../db' );

var postmarkClient, postmarkSender;

var noCache = process.env.NODE_ENV && process.env.NODE_ENV == 'development';
var nunjucks_env = new nunjucks.Environment( new nunjucks.FileSystemLoader( __dirname + '/views', { noCache: noCache } ) );
var nunjucksRender = Promise.promisify( nunjucks_env.render, { context: nunjucks_env } );

function setup()
{
	postmarkClient = new postmark.Client( db.core_settings.get( 'postmark' ) );
	postmarkSender = Promise.promisify( postmarkClient.sendEmail, { context: postmarkClient } );
}

// Send an email using a template
function send( data )
{
	return Promise.all( [
		nunjucksRender( data.template, _.assign( { html: true }, data ) ),
		nunjucksRender( data.template, _.assign( { html: false }, data ) ),
	] )
		.then( function( results )
		{
			return postmarkSender( {
				'From': 'Inform 7 Extensions Library <' + db.core_settings.get( 'sender' ) + '>',
				'To': data.to.displayName + ' <' + data.to.email + '>',
				'Subject': data.subject,
				'Tag': data.tag,
				'HtmlBody': juice( results[0] ),
				'TextBody': results[1],
			} );
		});
}

module.exports = {
	setup: setup,
	send: send,
};
