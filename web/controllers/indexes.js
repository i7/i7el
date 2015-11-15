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
		var promises = [];
		
		// The main query
		promises.push( Extension.findAndCountAll({
			order: [[ db.Sequelize.json( "data#>'{current,createdAt}'" ), 'DESC' ]],
			limit: 10,
		}) );
		
		// Stats
		promises.push( Extension.aggregate( 'author', 'count', { distinct: true } ) );
		
		var query = tags_query( req );
		query.limit = 12;
		promises.push( db.Tag.findAll( query ) );
		
		// Requests
		if ( req.user )
		{
			if ( req.user.can.admin )
			{
				promises.push( db.sequelize.query( 'SELECT SUM( CASE WHEN maintainership THEN 1 ELSE 0 END ) AS maintainershipcount, SUM( CASE WHEN maintainership THEN 0 ELSE 1 END ) AS approvalcount FROM "Requests";', { type: db.sequelize.QueryTypes.SELECT } ) );
			}
		}
		
		// promises = [ extensions, authors, tags, requests ]
		Promise.all( promises )
			.then( function( results )
			{
				var data = {
					extensions: results[0],
					stats: {
						authors: results[1],
						tags: results[2],
					},
				};
				if ( results[3] )
				{
					data.requests = results[3][0];
				}
				res.render( 'index', data );
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
