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
		
		var query = {},
		searchterms = [],
		tags = [];
		
		_.forEach( tokenizer( terms ), function( term )
		{
			// Support tagged terms
			if ( term.tag === 'title' )
			{
				return searchterms.push( { title: { $iLike: '%' + term + '%' } } );
			}
			if ( term.tag === 'author' )
			{
				return searchterms.push( { author: { $iLike: '%' + term + '%' } } );
			}
			if ( term.tag === 'tag' )
			{
				return tags.push( term.valueOf() );
			}
			return searchterms.push( { $or: [
				{ title: { $iLike: '%' + term + '%' } },
				{ author: { $iLike: '%' + term + '%' } },
				{ description: { $iLike: '%' + term + '%' } },
				{ documentation: { $iLike: '%' + term + '%' } },
			] } );
		});
		
		if ( searchterms.length )
		{
			query.where = { $and: searchterms };
		}
		
		if ( tags.length )
		{
			query.include = [{
				model: db.Tag,
				where: {
					tag: { $in: tags },
				},
			}];
		}
		
		query.order = [[ 'title', 'ASC' ]];
		
		Extension.findAll( query )
			.then( function( results )
			{
				// Filter results to ones which match all tags
				if ( tags.length )
				{
					results = _.filter( results, function( ext )
					{
						return _.every( tags, function( tag )
						{
							return ext.sortedTags().indexOf( tag ) > -1;
						});
					});
				}
				data.results = results;
				return res.render( 'search-results', data );
			});
	}
] ],

] );

};
