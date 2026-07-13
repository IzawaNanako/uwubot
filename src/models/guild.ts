import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface GuildAttributes {
	id: string;
	name: string;
	welcomeChannelId: string | null;
	byeChannelId: string | null;
	logChannelId: string | null;
	welcomeMessage: string;
	byeMessage: string;
	language: string;
}

interface GuildInstance extends Model<GuildAttributes>, GuildAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const Guild = sequelize.define<GuildInstance>('guild', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	welcomeChannelId: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	byeChannelId: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	logChannelId: {
		type: DataTypes.STRING,
		allowNull: true,
	},
	welcomeMessage: {
		type: DataTypes.STRING,
		defaultValue: 'Thank you for joining <[serverName]>!',
		allowNull: false,
	},
	byeMessage: {
		type: DataTypes.STRING,
		defaultValue: 'Goodbye <[username]>, we will miss you!',
		allowNull: false,
	},
	language: {
		type: DataTypes.STRING,
		defaultValue: 'en-US',
		allowNull: false,
	},
});

export { Guild };
