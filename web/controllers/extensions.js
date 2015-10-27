// Extension controller

var _ = require( 'lodash' );
var contentDisposition = require( 'content-disposition' );
var validator = require( 'validator' );
var urlencodedParser = require( 'body-parser' ).urlencoded({ extended: false });
var multer  = require( 'multer' );

var db = require( '../../db' );
var routes = require( '../routes.js' );
var util = require( '../util.js' );

var requireAdminPermissions = util.requirePermission( 'admin' );
var requireCreatePermissions = util.requirePermission( 'create' );
var requireEditThisPermissions = util.requirePermission( 'editthis' );
var showalert = util.showalert;
		
var multerparser = multer({
	storage: multer.memoryStorage(),
	limits: {
		files: 1,
		fileSize: 512 * 1024,
	},
});

function multer_error( err, req, res, next )
{
	if ( err.code == 'LIMIT_FILE_SIZE' )
	{
		return res.status( 400 ).render( 'extensions-new', { error: 'Upload too big; maximum file size is 512kB' } );
	}
	next( err );
}

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
				i7releases: db.core_settings.get( 'releases' ),
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
	
[ 'post', 'new', [ requireCreatePermissions, multerparser.single( 'file' ), multer_error, function create( req, res )
	{
		var user = req.user;
		
		function creation_error( msg )
		{
			res.status( 400 ).render( 'extensions-new', { error: msg } );
		}
		
		if ( !req.file )
		{
			return creation_error( 'No file selected' );
		}
		
		// Check for a valid extension
		var data = req.file.buffer.toString();
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
[ 'get', ':slug', [ showalert, function show( req, res )
	{
		var ext = req.extension;
		var data = {
			approved: ext.approved,
			description: ext.description || '',
			documentation: ext.documentation || '',
		};
		if ( req.session.extensions )
		{
			data.userext = req.session.extensions[ ext.slug ];
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
[ 'get', ':slug/edit', [ requireEditThisPermissions, showalert, function edit( req, res )
	{
		var ext = req.extension;
		
		// Edit the public library approval setting
		var approved = req.query.approved;
		if ( typeof approved != 'undefined' )
		{
			if ( !req.user.can.editany )
			{
				return res.status( 403 ).render( 'error', { type: 'authentication' } );
			}
			req.session.alert = {
				type: 'Success',
				msg: 'Extension ' + ( +( approved ) ? 'approved' : 'rejected' ),
			};
			req.extension.approved = approved;
			return req.extension.save()
				.then( function()
				{
					res.redirect( '/extensions/' + ext.slug );
				});
		}
		
		// Show the settings page
		var data = {
			description: ext.description || '',
			current: 'settings'
		};
		res.render( 'extensions-edit-settings', data );
	}
] ],

// Save extension data
[ 'post', ':slug/edit', [ requireEditThisPermissions, urlencodedParser, function saveExtension( req, res )
	{
		// Trim and validate urls
		function saveurl( prop )
		{
			var url = _.trim( req.body[ prop ] );
			req.extension.data[ prop ] = validator.isURL( url ) ? url : null;
		}
		
		var ext = req.extension;
		ext.description = _.trim( req.body.description );
		saveurl( 'website' );
		saveurl( 'discussion' );
		saveurl( 'bugs' );
		ext.changed( 'data', true );
		ext.save()
			.then( function()
			{
				req.session.alert = {
					type: 'Success',
					msg: 'Extension settings saved',
				};
				res.redirect( '/extensions/' + ext.slug + '/edit' );
			});
	}
] ],

// Delete an extension
[ 'get', ':slug/edit/delete', [ requireAdminPermissions, function deleteExt( req, res )
	{
		var ext = req.extension;
		var name = ext.title + ' by ' + ext.author;
		
		if ( req.query.confirm )
		{
			return ext.destroy()
				.then( function()
				{
					req.session.alert = {
						type: 'Success',
						msg: 'Extension ' + name + ' deleted',
					};
					res.redirect( '/' );
				});
		}
		
		var data = {
			current: 'delete'
		};
		res.render( 'extensions-edit-delete', data );
	}
] ],

// Show the list of versions
[ 'get', ':slug/versions', [ showalert, function list_versions( req, res )
	{
		req.extension.getVersions()
			.then( function( results )
			{
				var data = { versions: results };
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
