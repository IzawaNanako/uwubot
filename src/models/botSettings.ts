import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface BotSettingsAttributes {
	id: string;
	status: 'online' | 'idle' | 'dnd' | 'invisible';
	activityType: 'playing' | 'streaming' | 'listening' | 'watching' | 'competing' | 'custom' | 'none';
	activityName: string | null;
	activityUrl: string | null;
}

interface BotSettingsInstance extends Model<BotSettingsAttributes>, BotSettingsAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const BotSettings = sequelize.define<BotSettingsInstance>('botSettings', {
	id: {
		type: DataTypes.STRING,
		primaryKey: true,
	},
	status: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: 'dnd',
	},
	activityType: {
		type: DataTypes.STRING,
		allowNull: false,
		defaultValue: 'watching',
	},
	activityName: {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: 'cat videos',
	},
	activityUrl: {
		type: DataTypes.STRING,
		allowNull: true,
	},
});

export { BotSettings };
