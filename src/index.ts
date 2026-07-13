import 'dotenv/config.js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BotSettings } from '@models/botSettings.js';
import { GlobalStats } from '@models/globalStats.js';
import type { PresenceData } from 'discord.js';
import { ActivityType, Client, Collection, DiscordAPIError, GatewayIntentBits, Partials } from 'discord.js';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

const token = process.env.TOKEN;

if (!token) {
	console.log('Token not found.');
	process.exit(1);
}

try {
	await i18next.use(Backend).init({
		backend: {
			loadPath: join('dist/locales/{{lng}}/{{ns}}.json'),
		},
		lng: 'en-US',
		fallbackLng: 'en-US',
		preload: ['en-US'],
		load: 'currentOnly',
		ns: ['commands', 'events', 'games', 'general', 'languages'],
		defaultNS: 'commands',
		fallbackNS: 'commands',
		interpolation: {
			escapeValue: false,
		},
	});
} catch (error) {
	console.error(`i18next initialization error: ${error}`);
	process.exit(1);
}

const activityMap: Record<string, ActivityType> = {
	playing: ActivityType.Playing,
	streaming: ActivityType.Streaming,
	listening: ActivityType.Listening,
	watching: ActivityType.Watching,
	competing: ActivityType.Competing,
	custom: ActivityType.Custom,
} as const;
const [bot] = await BotSettings.findOrCreate({
	where: {
		id: process.env.CLIENT_ID,
	},
});
await GlobalStats.findOrCreate({
	where: {
		id: 1,
	},
});

if (!bot.status || !bot.activityType) {
	console.error('Bot status or activity type not found. Attempting to ignore activity settings.');
}

const status = bot.status;

/**
 * Gets the bot's presence data based on the stored bot settings.
 */
function getBotPresenceData(): PresenceData {
	let botPresenceDataTemp: PresenceData = {
		activities: [],
		status: status,
	};

	if (!bot.status || !bot.activityType) {
		console.error('Bot status or activity type not found. Attempting to ignore activity settings.');
		return botPresenceDataTemp;
	}
	if (bot.activityType === 'none') {
		return botPresenceDataTemp;
	}
	if (!bot.activityName) {
		console.error('Bot activity name not found. Attempting to ignore activity settings.');
		return botPresenceDataTemp;
	}

	const activityType = activityMap[bot.activityType] ?? ActivityType.Playing;

	if (activityType === ActivityType.Custom) {
		botPresenceDataTemp = {
			activities: [
				{
					name: 'custom',
					type: activityType,
					state: bot.activityName,
				},
			],
			status: status,
		};
		return botPresenceDataTemp;
	}
	if (activityType === ActivityType.Streaming) {
		if (!bot.activityUrl) {
			console.error('Stream URL not found. Attempting to ignore activity settings.');
			return botPresenceDataTemp;
		}
		botPresenceDataTemp = {
			activities: [
				{
					name: bot.activityName,
					type: activityType,
					url: bot.activityUrl,
				},
			],
			status: status,
		};
		return botPresenceDataTemp;
	}

	botPresenceDataTemp = {
		activities: [
			{
				name: bot.activityName,
				type: activityType,
			},
		],
		status: status,
	};

	return botPresenceDataTemp;
}

const botPresenceData = getBotPresenceData();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
	presence: botPresenceData,
});

client.commands = new Collection();
const foldersPath = join('dist/commands');
const commandFolders = readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = join(foldersPath, folder);
	const commandFiles = readdirSync(commandsPath);
	for (const file of commandFiles) {
		const filePath = join(commandsPath, file);
		const filePathURL = pathToFileURL(filePath);
		const command = await import(`${filePathURL}`);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			continue;
		}
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
		);
	}
}

const eventsPath = join('dist/events');
const eventFolders = readdirSync(eventsPath);

for (const folder of eventFolders) {
	const eventsPathFolder = join(eventsPath, folder);
	const eventFiles = readdirSync(eventsPathFolder);
	for (const file of eventFiles) {
		const filePath = join(eventsPathFolder, file);
		const filePathURL = pathToFileURL(filePath);
		const event = await import(`${filePathURL}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client));
			continue;
		}
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

await client.login(token);

process.on('unhandledRejection', (error) => {
	if (error instanceof DiscordAPIError && error.code !== 10008) {
		console.error(`<${new Date()}> Unhandled Promise Rejection: `, error);
	}
});

process.on('uncaughtException', (error) => {
	if (error instanceof DiscordAPIError && error.code === 10062) {
		console.error(`<${new Date()}> Unknown interaction found, possibly latency too high?`);
		return;
	}
	console.error(`<${new Date()}> Uncaught Exception: `, error);
});
