import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface GlobalStatsAttributes {
	id: number;
	totalTranslations: number;
	totalReplies: number;
}

interface GlobalStatsInstance extends Model<GlobalStatsAttributes>, GlobalStatsAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const GlobalStats = sequelize.define<GlobalStatsInstance>('globalStats', {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
	},
	totalTranslations: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
	totalReplies: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		allowNull: false,
	},
});

export { GlobalStats };
