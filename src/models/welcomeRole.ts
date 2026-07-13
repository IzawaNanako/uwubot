import { Guild } from '@models/guild.js';
import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface WelcomeRoleAttributes {
	id: string;
	guildId: string;
}

interface WelcomeRoleInstance extends Model<WelcomeRoleAttributes>, WelcomeRoleAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const WelcomeRole = sequelize.define<WelcomeRoleInstance>('welcomeRole', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	guildId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

Guild.hasMany(WelcomeRole, {
	foreignKey: 'guildId',
});
WelcomeRole.belongsTo(Guild, {
	foreignKey: 'guildId',
});

export { WelcomeRole };
