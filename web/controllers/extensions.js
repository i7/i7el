// Extension controller

var _ = require( 'lodash' );
var multer  = require( 'multer' );

var authentication = require( '../authentication.js' );
var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var multerparser = multer({
	limits: {
		files: 1,
		fileSize: 512 * 1024,
	},
	inMemory: true,
	putSingleFilesInArray: true,
});

function requirecreatepermissions( req, res, next )
{
	if ( req.user && req.user.can.create )
	{
		return next();
	}
	return res.status( 403 ).render( 'error', { type: 'authentication' } );
}

module.exports = function( router )
{

// Define the :ext parameter
router.param( 'ext', function( req, res, next, slug )
{
	// Check for valid slugs
	if ( !/^[\da-z_-]+$/.test( slug ) )
	{
		return res.status( 400 ).render( 'error', { msg: 'Invalid extension URL' } );
	}
	// Find this extension
	db.Extension.findOne(
	{
		where: { slug: slug },
		include: [ { model: db.Version, as: 'CurrentVersion' } ],
	})
		.then( function ( result )
		{
			if ( !result )
			{
				return res.status( 404 ).render( 'error', { msg: 'Extension not found' } );
			}
			req.extension = result;
			if ( req.user )
			{
				req.user.can.editthis = result.maintainer == req.user.email || req.user.can.editany;
			}
			next();
		});
});

routes.routemulti( router, 'extensions', [

[ 'get', '', [ function index( req, res )
	{
		
	} 
] ],

// Create or update an extension
[ 'get', 'new', [ requirecreatepermissions, function newext( req, res )
	{
		res.render( 'extensions-new', {} );
	} 
] ],
	
[ 'post', 'new', [ requirecreatepermissions, multerparser, function create( req, res )
	{
		var user = req.user;
		
		function creation_error( msg )
		{
			res.status( 400 ).render( 'extensions-new', { error: msg } );
		}
		
		if ( !req.files || !req.files.file || !req.files.file.length )
		{
			return creation_error( 'No file selected' );
		}
		
		// Check for a valid extension
		var data = req.files.file[0].buffer.toString();
		var titleline = data.match( /^.*$/m )[0];
		
		if ( !/.+ by .+ begins here/i.test( titleline ) )
		{
			return creation_error( 'Uploaded file does not appear to be a valid Inform 7 extension' );
		}
		
		// Check for a valid version string
		if ( !/^version +/i.test( titleline ) )
		{
			var date = new Date();
			return creation_error( 'The uploaded extension does not have a version number. Please add a version number in the format of V/YYMMDD. For example:<p>Version 1/' + _.padLeft( date.getFullYear() % 100, 2, '0' ) + _.padLeft( date.getMonth() + 1, 2, '0' ) +_.padLeft( date.getDate(), 2, '0' ) + ' of ' + _.escape( titleline ) );
		}
		
		if ( !/^version +\d+\/\d{6}/i.test( titleline ) )
		{
			return creation_error( 'The uploaded extension does not have a valid version number. Please add a version number in the format of V/YYMMDD, that is, a major version number, followed by a slash, followed by a date string (YYMMDD).' );
		}
		
		// Extract the extension details
		titleline = titleline.replace( /\(for (glulx|z-machine) only\) /i, '' );
		var details = titleline.match( /version +(\d+\/\d{6}) +of +(.+) +by +(.+) +begins here/i );
		
		if ( !details )
		{
			return creation_error( 'Unexpected error while extracting extension details' );
		}
		
		var versionnum = details[1];
		var title = details[2];
		var author = details[3];
		
		if ( title == '' || author == '' )
		{
			return creation_error( 'The extension title and author are not allowed to be blank' );
		}
		
		// Check if the extension has been uploaded before
		var slug = util.slug( title, author );
		var new_props = {
			title: title,
			author: author
		};
		if ( !user.can.editany )
		{
			new_props.maintainer = user.email;
		}
		db.Extension.findOrCreate({
			where: { slug: slug },
			defaults: new_props,
		})
			.spread( function( ext, created )
			{
				// The extension is pre-existing but this user is not the maintainer or an editor
				if ( !created && ext.maintainer != user.email && !user.can.editany )
				{
					// TODO: Better handling here - give a link to the extension + explain how to request maintainership
					return creation_error( 'This extension is currently maintained by someone else' );
				}
				
				// Find or create the version record
				var new_code = {
					code: data,
					uploader: user.email,
				};
				db.Version.findOrCreate({
					where: {
						version: versionnum,
						ExtensionId: ext.id,
					},
					defaults: new_code,
				})
					.spread( function( version, created )
					{
						// If it already exists, only update during the 1 day grace period
						if ( !created )
						{
							if ( version.stable() )
							{
								return creation_error( 'Unfortunately the one day grace period is over and this version of the extension cannot be overwritten. Please update the date portion of the version number, and try again.' );
							}
							// Update the code
							version.set( new_code );
							version.save()
								.then( function()
								{
									req.session.alert = {
										type: 'Success',
										msg: 'Extension uploaded and updated',
									};
									res.redirect ( '/extensions/' + slug );
								});
						}
						else
						{
							req.session.alert = {
								type: 'Success',
								msg: 'Extension uploaded',
							};
							res.redirect ( '/extensions/' + slug );
						}
					});
			});
	}
] ],

// The main extension page
[ 'get', ':ext', [ function show( req, res )
	{
		var ext = req.extension;
		var data = {
			slug: ext.slug,
			title: ext.title,
			author: ext.author,
			description: ext.description || '',
			currentversion: ext.CurrentVersion.version,
		};
		if ( req.session.alert )
		{
			data.alert = req.session.alert;
			delete req.session.alert;
		}
		res.render( 'extensions-show', data );
	} 
] ],

// Show the list of versions

// Download a particular version
[ 'get', ':slug/versions/:major/:date', [ function getversion( req, res )
	{
		var params = req.params;
		var version = req.params.major + '/' + req.params.date;
		if ( !/^[a-z\d_-]+$/.test( params.slug ) || !/^\d+\/\d{6}$/.test( version ) )
		{
			return res.status( 400 ).render( 'error', { msg: 'Invalid extension URL' } );
		}
		// Search for this version
		db.Version.findOne(
		{
			where: { version: version },
			include: [ {
				model: db.Extension,
				where: { slug: params.slug },
			} ],
		})
			.then( function ( result )
			{
				if ( !result )
				{
					return res.status( 404 ).render( 'error', { msg: 'Extension version not found' } );
				}
				// Success - send the file
				//res.type( 'text/x-natural-inform-extension' );
				res.type( 'text/plain' );
				res.set( 'Content-Disposition', 'inline; filename="' + encodeURI( result.Extension.title + '.i7x' ) + '"' );
				if ( result.stable() )
				{
					res.set( 'Cache-Control: max-age=31536000' );
				}
				res.send( result.code );
			});
	} 
] ],

] );

};
