// Searches

var _ = require( 'lodash' );
var tokenizer = require( '@curiousdannii/search-text-tokenizer' );

var db = require( '../../db' );
var routes = require( '../routes.js' );

module.exports = function( router )
{

routes.routemulti( router, null, [

[ 'get', 'extensions', [ function search( req, res )
	{
		var terms = _.trim( req.query.search ),
		data = {},
		Extension = db.Extension.pl_scope( req );
		
		if ( !terms )
		{
			// Show search help
			return res.render( 'search-help', {} );
		}
		
		data.searchquery = terms;
		
		tokens = _.map( tokenizer( terms ), function( term )
		{
			// Support tagged terms
			if ( term.tag === 'title' )
			{
				return { title: { $iLike: '%' + term + '%' } };
			}
			if ( term.tag === 'author' )
			{
				return { author: { $iLike: '%' + term + '%' } };
			}
			return { $or: [
				{ title: { $iLike: '%' + term + '%' } },
				{ author: { $iLike: '%' + term + '%' } },
				{ description: { $iLike: '%' + term + '%' } },
				{ documentation: { $iLike: '%' + term + '%' } },
			] };
		});
		
		Extension.findAll({
			where: { $and: tokens },
			order: [[ 'title', 'ASC' ]],
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
