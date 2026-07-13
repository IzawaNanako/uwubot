import { Guild } from '@models/guild.js';
import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface BannedMemberAttributes {
	id: string;
	username: string;
	totalBans: number;
	isBanned: boolean;
	bannedBy: string | null;
	bannedReason: string | null;
	bannedAt: Date | null;
	bannedUntil: Date | null;
	guildId: string;
}

interface BannedMemberInstance extends Model<BannedMemberAttributes>, BannedMemberAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const BannedMember = sequelize.define<BannedMemberInstance>('bannedMember', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	username: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	totalBans: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0,
	},
	isBanned: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false,
	},
	bannedBy: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	bannedReason: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	bannedAt: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	bannedUntil: {
		type: DataTypes.DATE,
		allowNull: true,
	},
	guildId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

Guild.hasMany(BannedMember, {
	foreignKey: 'guildId',
});
BannedMember.belongsTo(Guild, {
	foreignKey: 'guildId',
});

export { BannedMember };
