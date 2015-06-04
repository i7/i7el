// Extension controller

var _ = require( 'lodash' );
var multer  = require( 'multer' );

var authentication = require( '../authentication.js' );
var db = require( '../../db' );
var util = require( '../util.js' );

var multerparser = multer({
	limits: {
		files: 1,
		fileSize: 300 * 1024,
	},
	inMemory: true,
	putSingleFilesInArray: true,
});

function requirecreatepermissions( req, res, next )
{
	if ( req.user && req.user.can( 'create' ) )
	{
		return next();
	}
	return res.status( 403 ).render( 'error', { type: 'authentication' } );
}

module.exports = [

	[ 'get', '', [ function index( req, res )
		{
			
		} 
	] ],

	[ 'get', 'new', [ requirecreatepermissions, function newext( req, res )
		{
			res.render( 'extensions-new', {} );
		} 
	] ],
		
	[ 'post', 'new', [ requirecreatepermissions, multerparser, function create( req, res )
		{
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
			if ( !/^version +/i.test( titleline) )
			{
				var date = new Date();
				return creation_error( 'The uploaded extension does not have a version number. Please add a version number in the format of V/YYMMDD. For example:<p>Version 1/' + _.padLeft( date.getFullYear() % 100, 2, '0' ) + _.padLeft( date.getMonth() + 1, 2, '0' ) +_.padLeft( date.getDate(), 2, '0' ) + ' of ' + _.escape( titleline ) );
			}
			
			if ( !/^version +\d+\/\d{6}/i.test( titleline) )
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
			
			var version = details[1];
			var title = details[2];
			var author = details[3];
			
			if ( title == '' || author == '' )
			{
				return creation_error( 'The extension title and author are not allowed to be blank' );
			}
			
			res.render( 'extensions-new', {} );
		}
	] ],

];
