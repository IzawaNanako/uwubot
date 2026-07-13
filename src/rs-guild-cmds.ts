import 'dotenv/config.js';
import type { ApplicationCommand } from 'discord.js';
import { REST, Routes } from 'discord.js';

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.TOKEN;

if (!clientId || !guildId || !token) {
	console.error('Client ID or guild ID or token not found.');
	process.exit(1);
}

function isCommandArray(data: unknown): data is ApplicationCommand[] {
	if (!Array.isArray(data)) {
		return false;
	}
	if (data.length === 0) {
		return true;
	}

	const firstItem = data[0];
	return typeof firstItem === 'object' && firstItem !== null && 'id' in firstItem && 'name' in firstItem;
}

/**
 * Deletes all commands in the guild except the "dev" command.
 */
async function deleteGuildCommands(clientId: string, guildId: string, token: string): Promise<void> {
	try {
		const rest = new REST().setToken(token);
		const commands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
		if (!isCommandArray(commands)) {
			throw new Error('Discord API returned unexpected data format for commands!');
		}

		const deletePromises = commands
			.filter(command => command.name !== 'dev')
			.map(command => {
				return rest.delete(Routes.applicationGuildCommand(clientId, guildId, command.id));
			});
		await Promise.all(deletePromises);

		console.log('Successfully deleted all guild commands. (Exceptions made for the "dev" command)');
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

await deleteGuildCommands(clientId, guildId, token);
