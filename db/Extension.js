module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Extension", {
		slug: {
			type: DataTypes.TEXT,
			unique: true,
		},
		title: DataTypes.TEXT,
		author: DataTypes.TEXT,
		// Maintainer email address
		maintainer: DataTypes.TEXT,
		// Approved for the public library
		approved: DataTypes.BOOLEAN,
		// description
		// categories/tags
	});
};
