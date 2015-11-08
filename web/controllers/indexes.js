// Indexes

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var showalert = util.showalert;

// Get a list of tags by number of extensions, filtering for approval if needed
function tags_query( req )
{
	var query = {
		attributes: [ 'tag', [ db.Sequelize.fn( 'count', db.Sequelize.col( 'tag' ) ), 'count' ] ],
		group: 'tag',
		order: [ ['count', 'DESC'], ['tag', 'ASC'] ],
		raw: true,
	};
	if ( req.session.pl )
	{
		query.include = [{
			model: db.Extension,
			attributes: [],
			where: {
				approved: true,
			},
		}];
	}
	return query;
}

module.exports = function( router )
{

routes.routemulti( router, null, [

// The main index
[ 'get', '', [ showalert, function index( req, res )
	{
		var Extension = db.Extension.pl_scope( req );
		
		// The main query
		var exts = Extension.findAndCountAll({
			order: [[ db.Sequelize.json( "data#>'{current,createdAt}'" ), 'DESC' ]],
			limit: 10,
		});
		
		// Stats
		var authors = Extension.aggregate( 'author', 'count', { distinct: true } );
		
		var query = tags_query( req );
		query.limit = 12;
		var tags = db.Tag.findAll( query );
		
		Promise.all( [ exts, authors, tags ] )
			.then( function( results )
			{
				res.render( 'index', {
					extensions: results[0],
					stats: {
						authors: results[1],
						tags: results[2],
					},
				});
			});
	}
] ],

// The list of authors
[ 'get', 'authors', [ function authors( req, res )
	{
		var Extension = db.Extension.pl_scope( req );
		
		Extension.aggregate( 'author', 'count', {
			attributes: [ 'author' ],
			group: 'author',
			order: [[ 'author', 'ASC' ]],
			plain: false,
		})
			.then( function( results )
			{
				res.render( 'authors', { authors: results });
			});
	}
] ],

// Tags
[ 'get', /tags(\.json)?$/, [ function tags( req, res )
	{
		db.Tag.findAll( tags_query( req ) )
			.then( function( results )
			{
				if ( req.params[0] == '.json' )
				{
					results = results.map( function( tag ) { return tag.tag; } );
					//res.set( 'Cache-Control', 'max-age=600' );
					return res.json( results );
				}
				res.render( 'tags', { tags: results });
			});
	}
] ],

// About
[ 'get', 'about', [ function about( req, res )
	{
		res.render( 'about', {} );
	}
] ],

] );

};
