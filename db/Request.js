module.exports = function( sequelize, DataTypes )
{
	return sequelize.define( "Request", {
		// True if maintainership request, false for approval request
		maintainership: DataTypes.BOOLEAN,
		// Details of requester (name and email)
		requester: DataTypes.JSONB,
		message: DataTypes.TEXT,
		// The time we last emailed, and maybe a list of people we have already emailed
		emailed: DataTypes.JSONB,
	});
};
