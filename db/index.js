// Connect to and initiate the database

var Sequelize = require( 'sequelize' );
var hooks = require( './hooks.js' );

var env = process.env.NODE_ENV || 'development';
var db = module.exports = {};

var options = {
	dialectOptions: {
		ssl: true,
	},
	logging: false,
};

// Connect to the database
console.log( 'i7el: Connecting to database' );
try
{
	var config = require( __dirname + '/config.json' )[env];
	var sequelize = new Sequelize( config.url, options );
}
catch ( err )
{
	if ( !process.env.DATABASE_URL )
	{
		throw new Error( 'DATABASE_URL environment variable not set!' );
	}
	var sequelize = new Sequelize( process.env.DATABASE_URL, options );
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Load our models
var Setting = db.Setting = sequelize.import( __dirname + '/Setting.js' );
var Version = db.Version = sequelize.import( __dirname + '/Version.js' );
var Extension = db.Extension = sequelize.import( __dirname + '/Extension.js' );

// Set up the relations
Version.belongsTo( Extension );
Extension.hasMany( Version );

// Load the hooks
hooks( db );
