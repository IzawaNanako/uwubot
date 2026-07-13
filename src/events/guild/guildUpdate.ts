import { Guild } from '@models/guild.js';
import type { Guild as DiscordGuild } from 'discord.js';
import { Events } from 'discord.js';

export const name = Events.GuildUpdate;

export async function execute(guild: DiscordGuild): Promise<void> {
	const [guildData] = await Guild.findOrCreate({
		where: {
			id: guild.id,
		},
	});

	if (guildData.name !== guild.name) {
		await guildData.update({
			name: guild.name,
		});
	}
}
