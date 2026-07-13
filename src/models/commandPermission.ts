import { Guild } from '@models/guild.js';
import { sequelize } from '@utils/database.js';
import { DataTypes, type Model } from 'sequelize';

interface CommandPermissionAttributes {
	id: number;
	guildId: string;
	commandName: string;
	isEnabled: boolean;
}

interface CommandPermissionInstance extends Model<CommandPermissionAttributes>, CommandPermissionAttributes {
	createdAt?: Date;
	updatedAt?: Date;
}

const CommandPermission = sequelize.define<CommandPermissionInstance>('commandPermission', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
	},
	guildId: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	commandName: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	isEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: true,
		allowNull: false,
	},
});

Guild.hasMany(CommandPermission, {
	foreignKey: 'guildId',
	as: 'permissions',
});
CommandPermission.belongsTo(Guild, {
	foreignKey: 'guildId',
});

export { CommandPermission };
