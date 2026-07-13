import 'dotenv/config.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ApplicationCommand } from 'discord.js';
import { REST, Routes } from 'discord.js';

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

if (!clientId || !token) {
	throw new Error('Client ID or token not found.');
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

const commands: ApplicationCommand[] = [];
const foldersPath = join('dist/commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath);
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const filePathURL = pathToFileURL(`./${filePath}`);
		const command = await import(`${filePathURL}`);
		if ('data' in command && 'execute' in command && command.data.name !== 'dev') {
			commands.push(command.data.toJSON());
			continue;
		}
		if (command.data.name === 'dev') {
			continue;
		}
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

async function reloadGlobalCommands(clientId: string, token: string): Promise<void> {
	try {
		console.log(`Started reloading ${commands.length} application commands.`);

		const rest = new REST().setToken(token);

		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{
				body: commands,
			},
		);

		if (!isCommandArray(data)) {
			throw new Error('Discord API returned unexpected data format for commands!');
		}

		console.log(`Successfully reloaded ${data.length} application commands.`);
	} catch (error) {
		console.error(error);
	}
}

await reloadGlobalCommands(clientId, token);
