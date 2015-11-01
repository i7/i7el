// Indexes

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var showalert = util.showalert;

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
		
		Promise.all( [ exts, authors ] )
			.then( function( results )
			{
				res.render( 'index', {
					extensions: results[0],
					stats: {
						authors: results[1],
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
		// TODO: can we add pl scoping to tags?
		
		db.Tag.aggregate( 'tag', 'count', {
			attributes: [ 'tag' ],
			group: 'tag',
			order: [[ 'count', 'DESC' ]],
			plain: false,
		})
			.then( function( results )
			{
				if ( req.params[0] == '.json' )
				{
					res.set( 'Cache-Control', 'max-age=600' );
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
