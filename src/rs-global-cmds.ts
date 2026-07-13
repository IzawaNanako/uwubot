import 'dotenv/config.js';
import { REST, Routes } from 'discord.js';

const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

if (!clientId || !token) {
	console.error('Client ID or token not found.');
	process.exit(1);
}

async function deleteGlobalCommands(clientId: string, token: string): Promise<void> {
	try {
		const rest = new REST().setToken(token);

		await rest.put(Routes.applicationCommands(clientId), {
			body: [],
		});

		console.log('Successfully deleted all global commands.');
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

await deleteGlobalCommands(clientId, token);
