// Extension controller

var _ = require( 'lodash' );
var tokenizer = require('search-text-tokenizer');

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

module.exports = function( router )
{

routes.routemulti( router, null, [

[ 'get', '', [ function index( req, res )
	{
		db.Extension.findAndCountAll({
			order: [[ 'updatedAt', 'DESC' ]],
			limit: 10,
		}).then( function( results )
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
		
		tokens = tokenizer( terms );
		tokens = _( tokens ).map( function( term )
		{
			return { $or: [
				{ title: { $iLike: '%' + term + '%' } },
				{ author: { $iLike: '%' + term + '%' } },
				{ description: { $iLike: '%' + term + '%' } },
				{ documentation: { $iLike: '%' + term + '%' } },
			] };
		});
		
		db.Extension.findAll({
			where: { $and: tokens },
		})
			.then( function( results )
			{
				data.results = results;
				return res.render( 'search-results', data );
			});
	}
] ],

] );

};
