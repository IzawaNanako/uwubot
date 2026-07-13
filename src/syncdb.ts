import 'dotenv/config.js';
import { BannedMember } from '@models/bannedMember.js';
import { BotSettings } from '@models/botSettings.js';
import { CommandPermission } from '@models/commandPermission.js';
import { GlobalStats } from '@models/globalStats.js';
import { Guild } from '@models/guild.js';
import { GuildMember } from '@models/guildMember.js';
import { Reminder } from '@models/reminder.js';
import { User } from '@models/user.js';
import { WelcomeRole } from '@models/welcomeRole.js';
import { sequelize } from '@utils/database.js';

const models = [
	Guild,
	User,
	BannedMember,
	BotSettings,
	CommandPermission,
	GlobalStats,
	GuildMember,
	Reminder,
	WelcomeRole,
];

try {
	await sequelize.authenticate();
	console.log('Syncing database...');

	for (const model of models) {
		await model.sync({
			alter: true,
		});

		console.log(`Synced: ${model.name}`);
	}

	console.log('All models synced.');
} catch (error) {
	console.error('Failed to sync DB:', error);
	process.exit(1);
}
