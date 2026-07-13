import { SlashCommandBuilder } from '@discordjs/builders';
import { BotSettings } from '@models/botSettings.js';
import type { ActivitiesOptions, ChatInputCommandInteraction, TextBasedChannel } from 'discord.js';
import { ActivityType, EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';

export type BotStatus = 'online' | 'idle' | 'dnd' | 'invisible';
export type BotActivityType = 'playing' | 'streaming' | 'listening' | 'watching' | 'competing' | 'custom' | 'none';

const VALID_STATUSES = new Set<string>([
	'online',
	'idle',
	'dnd',
	'invisible',
]);

function isValidStatus(status: string | undefined): status is BotStatus {
	return !!status && VALID_STATUSES.has(status);
}

const VALID_ACTIVITIES = new Set<string>([
	'playing',
	'streaming',
	'listening',
	'watching',
	'competing',
	'custom',
	'none',
]);

function isValidActivity(activity: string | undefined): activity is BotActivityType {
	return !!activity && VALID_ACTIVITIES.has(activity);
}

const activityMap: Record<Exclude<BotActivityType, 'none'>, ActivityType> = {
	'playing': ActivityType.Playing,
	'streaming': ActivityType.Streaming,
	'listening': ActivityType.Listening,
	'watching': ActivityType.Watching,
	'competing': ActivityType.Competing,
	'custom': ActivityType.Custom,
};

export const data = new SlashCommandBuilder()
	.setName('dev')
	.setDescription('Developer commands that control the bot directly, accessible only by the developer.')
	.addStringOption(option =>
		option
			.setName('option')
			.setDescription('The action to take.')
			.setRequired(true)
			.addChoices(
				{
					name: 'stop',
					value: 'stop',
				},
				{
					name: 'username',
					value: 'username',
				},
				{
					name: 'status',
					value: 'status',
				},
				{
					name: 'list-guilds',
					value: 'list-guilds',
				},
				{
					name: 'leave',
					value: 'leave',
				},
				{
					name: 'test',
					value: 'test',
				},
			)
	)
	.addStringOption(option =>
		option
			.setName('value')
			.setDescription('The value to set, if one is needed.')
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	if (interaction.user.id !== process.env.OWNER_ID) {
		await interaction.reply({
			content: 'You do not have the permission to use this command.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.channel) {
		await interaction.reply({
			content: 'Something went wrong...',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const option = interaction.options.getString('option', true);
	const value = interaction.options.getString('value');

	const actionMap: Record<string, () => Promise<void>> = {
		'stop': () => handleStop(interaction),
		'username': () => handleUsername(interaction, value),
		'status': () => handleStatus(interaction, value),
		'list-guilds': () => handleListGuilds(interaction),
		'leave': () => handleLeave(interaction, value),
		'test': () => handleTest(interaction),
	};

	const executeAction = actionMap[option];

	if (!executeAction) {
		await interaction.reply({
			content: 'Invalid option.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await executeAction();
}

async function handleStop(interaction: ChatInputCommandInteraction): Promise<void> {
	await interaction.reply({
		content: 'Shutting down...',
	});
	process.exit(0);
}

async function handleUsername(interaction: ChatInputCommandInteraction, value: string | null): Promise<void> {
	if (!value) {
		await interaction.reply({
			content: 'Please provide a name.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	try {
		await interaction.client.user.setUsername(value);
		await interaction.reply({
			content: `Changing my username to ${value}...`,
		});
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: 'Failed to set username.',
			flags: MessageFlags.Ephemeral,
		});
	}
}

async function handleListGuilds(interaction: ChatInputCommandInteraction): Promise<void> {
	const guildList = interaction.client.guilds.cache
		.map(g => `**${g.name}** \`\`\`${g.id}\`\`\``)
		.join('\n');

	const embed = new EmbedBuilder()
		.setColor('#0099ff')
		.setTitle('Guild List')
		.setDescription(guildList.length > 4096 ? `${guildList.slice(0, 4093)}...` : guildList || 'No guilds were found.');

	await interaction.reply({
		embeds: [embed],
		flags: MessageFlags.Ephemeral,
	});
}

async function handleLeave(interaction: ChatInputCommandInteraction, value: string | null): Promise<void> {
	if (!value) {
		await interaction.reply({
			content: 'Please provide a guild ID in the "value" field.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const guildToLeave = interaction.client.guilds.cache.get(value);

	if (!guildToLeave) {
		await interaction.reply({
			content: `Guild with the ID \`${value}\` not found. Make sure the bot is in the guild.`,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	try {
		await guildToLeave.leave();
		await interaction.reply({
			content: `Successfully left **${guildToLeave.name}** forcefully!`,
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: 'Failed to leave the selected guild. Check logs for more information.',
			flags: MessageFlags.Ephemeral,
		});
	}
}

async function handleTest(interaction: ChatInputCommandInteraction): Promise<void> {
	await interaction.reply({
		content: 'This is a test command.',
		flags: MessageFlags.Ephemeral,
	});
	console.log('Test command executed by: ', interaction.user.displayName);
}

async function waitForResponse(channel: TextBasedChannel, userId: string): Promise<string | undefined> {
	if (!channel?.isSendable()) {
		return;
	}

	const messages = await channel.awaitMessages({
		filter: m => m.author.id === userId,
		max: 1,
		time: 30000,
		errors: ['time'],
	}).catch(() => null);

	return messages?.first()?.content;
}

async function handleStatus(interaction: ChatInputCommandInteraction, value: string | null): Promise<void> {
	if (value) {
		await interaction.reply({
			content: 'Invalid format, keep value field empty for this option.',
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const channel = interaction.channel;

	if (!channel?.isSendable()) {
		return;
	}

	await interaction.reply({ content: 'Please enter a status: "online", "idle", "dnd" or "invisible".' });
	const statusInput = (await waitForResponse(channel, interaction.user.id))?.toLowerCase();

	if (!isValidStatus(statusInput)) {
		await channel.send({
			content: 'Invalid status.',
		});
		return;
	}

	await channel.send({
		content: 'Please enter activity type: "playing", "streaming", "listening", "watching", "competing", "custom" or "none".',
	});
	const activityInput = (await waitForResponse(channel, interaction.user.id))?.toLowerCase();

	if (!isValidActivity(activityInput)) {
		await channel.send({
			content: 'Invalid activity type.',
		});
		return;
	}

	if (activityInput === 'none') {
		await channel.send({
			content: 'Setting status...',
		});
		interaction.client.user.setPresence({ activities: [], status: statusInput });
		await storeStatus(statusInput, activityInput, null, null);
		return;
	}

	const activityTypeMapped = activityMap[activityInput];

	if (activityInput === 'custom') {
		await channel.send({
			content: 'Please enter the activity texts.',
		});
		const activityTexts = await waitForResponse(channel, interaction.user.id);

		if (!activityTexts) {
			await channel.send({
				content: 'Failed to set status. Check your input.',
			});
			return;
		}

		await setAndStorePresence(interaction, channel, statusInput, activityInput, activityTypeMapped, 'custom', activityTexts, null);
		return;
	}

	if (activityInput === 'streaming') {
		await channel.send({
			content: 'Please enter the text after stream name.',
		});
		const streamName = await waitForResponse(channel, interaction.user.id);

		await channel.send({
			content: 'Please enter stream URL, only Twitch and Youtube URLs are supported.',
		});
		const streamURL = await waitForResponse(channel, interaction.user.id);

		if (!streamName || !streamURL) {
			await channel.send({
				content: 'Failed to set status. Check your input.',
			});
			return;
		}

		await setAndStorePresence(interaction, channel, statusInput, activityInput, activityTypeMapped, streamName, null, streamURL);
		return;
	}

	await channel.send({
		content: 'Please enter activity name.',
	});
	const activityName = await waitForResponse(channel, interaction.user.id);

	if (!activityName) {
		await channel.send({
			content: 'Failed to set status. Check your input.',
		});
		return;
	}

	await setAndStorePresence(interaction, channel, statusInput, activityInput, activityTypeMapped, activityName, null, null);
}

async function setAndStorePresence(interaction: ChatInputCommandInteraction, channel: TextBasedChannel, status: BotStatus, activityType: BotActivityType, discordActivityType: ActivityType, name: string, state: string | null, url: string | null): Promise<void> {
	if (!channel?.isSendable()) {
		return;
	}

	try {
		await channel.send({
			content: 'Setting status...',
		});

		const activityObj: ActivitiesOptions = {
			name,
			type: discordActivityType,
			...(state && { state }),
			...(url && { url }),
		};

		interaction.client.user.setPresence({
			activities: [activityObj],
			status: status,
		});

		await storeStatus(status, activityType, state ?? name, url);
	} catch (error) {
		console.error(error);
		await channel.send({
			content: 'Failed to set status. Try again later.',
		});
	}
}

async function storeStatus(status: BotStatus, activityType: BotActivityType, activityName: string | null, activityUrl: string | null): Promise<void> {
	const bot = await BotSettings.findOne({
		where: {
			id: 'Nanaz',
		},
	});

	if (!bot) {
		console.error('Bot not found.');
		process.exit(1);
	}

	await bot.update({
		status,
		activityType,
		activityName,
		activityUrl: activityUrl ?? null,
	});
}
