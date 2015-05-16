module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Extension", {
		title: DataTypes.TEXT,
		author: DataTypes.TEXT,
		maintainer: DataTypes.TEXT,
		// Approved for the public library
		approved: DataTypes.BOOLEAN,
		// description
		// categories/tags
	});
};
