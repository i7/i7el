// Searches

var _ = require( 'lodash' );
var speakingurl = require( 'speakingurl' );
var tokenizer = require( 'search-text-tokenizer' );

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
			var likeTerm = { $iLike: '%' + term.term + '%' };
			
			// Support tagged terms
			if ( term.tag === 'title' )
			{
				return searchterms.push( { title: likeTerm } );
			}
			if ( term.tag === 'author' )
			{
				return searchterms.push( { author: likeTerm } );
			}
			if ( term.tag === 'tag' )
			{
				return tags.push( term.term );
			}
			return searchterms.push( { $or: [
				{ title: likeTerm },
				{ author: likeTerm },
				{ description: likeTerm },
				{ documentation: likeTerm },
			] } );
		});
		
		if ( searchterms.length )
		{
			query.where = { $and: searchterms };
			
			// If the search included 'by' then match it against the slug
			if ( /\sby\s/i.test( terms ) )
			{
				query.where = { $or: [ query.where, { slug: { $iLike: '%' + speakingurl( terms ) + '%' } } ] };
			}
		}
		
		// Match required tag
		if ( tags.length == 1 )
		{
			query.include = [{
				model: db.Tag,
				attributes: [],
				where: {
					tag: tags[0],
				},
			}];
		}
		// Require extensions to have associations with all specified tags
		if ( tags.length > 1 )
		{
			_.assign( query, {
				include: [{
					model: db.Tag,
					attributes: [],
					where: {
						tag: { $in: tags },
					},
				}],
				group: '"Extension"."id"',
				having: [ 'COUNT(*) = ?', tags.length ],
			});
		}
		
		query.order = [[ 'title', 'ASC' ]];
		
		Extension.findAll( query )
			.then( function( results )
			{
				data.results = results;
				return res.render( 'search-results', data );
			});
	}
] ],

] );

};
