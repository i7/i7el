// The foreign key on Versions didn't have ON DELETE CASCADE

module.exports = {
	up: function ( migration, DataTypes )
	{
		return migration.sequelize.query( 'ALTER TABLE "Versions" DROP CONSTRAINT "Versions_ExtensionId_fkey", ADD CONSTRAINT "Versions_ExtensionId_fkey" FOREIGN KEY ("ExtensionId") REFERENCES "Extensions" (id) ON DELETE CASCADE;' );
	}
};
