// Extension controller

var _ = require( 'lodash' );
var contentDisposition = require( 'content-disposition' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });
var multer  = require( 'multer' );

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

var requireCreatePermissions = util.requirePermission( 'create' );
var requireEditThisPermissions = util.requirePermission( 'editthis' );

module.exports = function( router )
{

// Define the :slug parameter
router.param( 'slug', function( req, res, next, slug )
{
	// Check for valid slugs
	if ( !/^[\da-z_-]+$/.test( slug ) )
	{
		return res.status( 400 ).render( 'error', { msg: 'Invalid extension URL' } );
	}
	// Find this extension
	db.Extension.findOne({ where: { slug: slug } })
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
			_.extend( res.locals, {
				slug: slug,
				title: result.title,
				author: result.author,
				data: result.data,
				i7releases: req.app.locals.settings.releases,
			});
			next();
		});
});

// Handle the :major and :data parameters
router.param( 'date', function( req, res, next, date )
{
	var version = req.params.major + '/' + date;
	if ( !/^\d+\/\d{6}$/.test( version ) )
	{
		return res.status( 400 ).render( 'error', { msg: 'Invalid extension URL' } );
	}
	// Search for this version
	req.extension.getVersions({ where: { version: version } })
		.then( function ( result )
		{
			if ( !result || !result.length )
			{
				return res.status( 404 ).render( 'error', { msg: 'Extension version not found' } );
			}
			req.version = result[0];
			_.extend( res.locals, {
				version: result[0].version,
			});
			next();
		});
});

routes.routemulti( router, 'extensions', [

// The root /extensions page is found in search.js

// Create or update an extension
[ 'get', 'new', [ requireCreatePermissions, function newext( req, res )
	{
		res.render( 'extensions-new', {} );
	} 
] ],
	
[ 'post', 'new', [ requireCreatePermissions, multerparser, function create( req, res )
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
		var title = _.trim( details[2] ).replace( /\s+/g, ' ' );
		var author = _.trim( details[3] ).replace( /\s+/g, ' ' );
		
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
			.spread( function( ext, extcreated )
			{
				// The extension is pre-existing but this user is not the maintainer or an editor
				if ( !extcreated && ext.maintainer != user.email && !user.can.editany )
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
					.spread( function( version, verscreated )
					{
						// If it already exists, only update during the 1 day grace period
						if ( !verscreated )
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
								msg: extcreated ? 'Extension uploaded' : 'Extension version uploaded',
							};
							//req.session.showdialog = 1;
							res.redirect( '/extensions/' + slug );
						}
					});
			});
	}
] ],

// The main extension page
[ 'get', ':slug', [ function show( req, res )
	{
		var ext = req.extension;
		var data = {
			approved: ext.approved,
			description: ext.description || '',
			documentation: ext.documentation || '',
		};
		if ( req.session.alert )
		{
			data.alert = req.session.alert;
			delete req.session.alert;
		}
		/*// Show the I7 releases dialog when first creating an extension
		if ( !req.session.showdialog )
		{
			data.showdialog = 1;
			data.js = {
				i7releases: req.app.locals.settings.releases,
			};
			delete req.session.showdialog;
		}*/
		res.render( 'extensions-show', data );
	}
] ],

// Edit extension
[ 'get', ':slug/edit', [ requireEditThisPermissions, function edit( req, res )
	{
		var ext = req.extension;
		var userCanEditAny = req.user.can.editany;
		
		function auth_error()
		{
			return res.status( 403 ).render( 'error', { type: 'authentication' } );
		}
		
		// Edit the public library approval setting
		var approved = req.query.approved;
		if ( typeof approved != 'undefined' )
		{
			if ( !userCanEditAny )
			{
				return auth_error();
			}
			req.session.alert = {
				type: 'Success',
				msg: 'Extension ' + ( +( approved ) ? 'approved' : 'rejected' ),
			};
			req.extension.approved = approved;
			req.extension.save()
				.then( function()
				{
					res.redirect( '/extensions/' + ext.slug );
				});
		}
	}
] ],

// Show the list of versions
[ 'get', ':slug/versions', [ function list_versions( req, res )
	{
		var data = {};
		if ( req.session.alert )
		{
			data.alert = req.session.alert;
			delete req.session.alert;
		}
		req.extension.getVersions()
			.then( function( results )
			{
				data.versions = results;
				req.session.returnFromVersionEdit = req.path;
				res.render( 'versions-list', data );
			});
	}
] ],

// Download a particular version
[ 'get', ':slug/versions/:major/:date', [ function getversion( req, res )
	{
		// Send the file
		//res.type( 'text/x-natural-inform-extension' );
		res.type( 'text/plain' );
		res.set( 'Content-Disposition', contentDisposition( req.extension.title + '.i7x', { type: 'inline' } ) );
		if ( req.version.stable() )
		{
			res.set( 'Cache-Control', 'max-age=31536000' );
		}
		res.send( req.version.code );
	}
] ],

// Edit the i7releases of a version
[ 'get', ':slug/versions/:major/:date/edit', [ requireEditThisPermissions, function editi7releases( req, res )
	{
		var data = {
			thisi7releases: req.version.releasesToArray(),
			returnPath: req.session.returnFromVersionEdit || '/extensions/' + req.params.slug,
		};
		res.render( 'versions-edit', data );
	}
] ],

// Edit the i7releases of a version
[ 'post', ':slug/versions/:major/:date', [ requireEditThisPermissions, urlencodedParser, function savei7releases( req, res )
	{
		req.version.i7releases = req.body.i7releases;
		req.version.save()
			.then( function()
			{
				req.session.alert = {
					type: 'Success',
					msg: 'Version ' + req.version.version + ' updated',
				};
				var path = req.session.returnFromVersionEdit || '/extensions/' + req.params.slug;
				req.session.returnFromVersionEdit = null;
				res.redirect( path );
			});
	}
] ],

] );

};
