import { Guild } from '@models/guild.js';
import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface GuildMemberAttributes {
	id: string;
	isKicked: boolean;
	guildId: string;
}

interface GuildMemberInstance extends Model<GuildMemberAttributes>, GuildMemberAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const GuildMember = sequelize.define<GuildMemberInstance>('guildMember', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	isKicked: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	guildId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

Guild.hasMany(GuildMember, {
	foreignKey: 'guildId',
});
GuildMember.belongsTo(Guild, {
	foreignKey: 'guildId',
});

export { GuildMember };
