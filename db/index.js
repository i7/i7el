// Connect to and initiate the database

var Sequelize = require( 'sequelize' );

var hooks = require( './hooks.js' );

// Connect to the database
if ( !process.env.DATABASE_URL )
{
	throw new Error( 'DATABASE_URL environment variable not set!' );
}

var match = process.env.DATABASE_URL.match( /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/ );

var sequelize = new Sequelize( match[5], match[1], match[2], {
	dialect: 'postgres',
	protocol: 'postgres',
	dialectOptions: {
		ssl: true,
	},
	host: match[3],
	port: match[4],
	logging: false,
});

var Setting = sequelize.import( __dirname + '/Setting.js' );
var Extension = sequelize.import( __dirname + '/Extension.js' );
var Version = sequelize.import( __dirname + '/Version.js' );

Version.belongsTo( Extension );
Extension.hasMany( Version );
Extension.belongsTo( Version, {
	as: 'CurrentVersion',
	constraints: false,
});

exports = {
    Sequelize: Sequelize,
    sequelize: sequelize,
    Setting: Setting,
    Extension: Extension,
    Version: Version,
};

hooks( exports );

module.exports = exports;
