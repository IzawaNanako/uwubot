import { Guild } from '@models/guild.js';
import type { Guild as DiscordGuild } from 'discord.js';
import { Events } from 'discord.js';

export const name = Events.GuildCreate;

export async function execute(guild: DiscordGuild): Promise<void> {
	console.log(`Joined new guild: ${guild.name} (${guild.id})`);

	await Guild.create({
		id: guild.id,
		name: guild.name,
		welcomeMessage: 'Thank you for joining <[serverName]>!',
		byeMessage: 'Goodbye <[username]>, we will miss you!',
		language: 'en-US',
	});
}
