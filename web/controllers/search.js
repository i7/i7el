// Extension controller

var _ = require( 'lodash' );
var tokenizer = require('search-text-tokenizer');

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var showalert = util.showalert;

function merge_pl( req, query )
{
	if ( req.session.pl )
	{
		_.merge( query, {
			where: {
				approved: true,
			}
		});
	}
}

module.exports = function( router )
{

routes.routemulti( router, null, [

[ 'get', '', [ showalert, function index( req, res )
	{
		var query = {
			order: [[ 'updatedAt', 'DESC' ]],
			limit: 10,
		};
		merge_pl( req, query );
		db.Extension.findAndCountAll( query )
			.then( function( results )
			{
				res.render( 'index', { extensions: results } );
			});
	}
] ],

[ 'get', 'extensions', [ function search( req, res )
	{
		var terms = _.trim( req.query.search ),
		data = {};
		
		if ( !terms )
		{
			// Show search help
			return res.render( 'search-help', {} );
		}
		
		data.query = terms;
		
		tokens = _.map( tokenizer( terms ), function( term )
		{
			return { $or: [
				{ title: { $iLike: '%' + term + '%' } },
				{ author: { $iLike: '%' + term + '%' } },
				{ description: { $iLike: '%' + term + '%' } },
				{ documentation: { $iLike: '%' + term + '%' } },
			] };
		});
		
		var query = {
			where: { $and: tokens },
		};
		merge_pl( req, query );
		db.Extension.findAll( query )
			.then( function( results )
			{
				data.results = results;
				return res.render( 'search-results', data );
			});
	}
] ],

] );

};
