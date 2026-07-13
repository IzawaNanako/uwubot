import { BannedMember } from '@models/bannedMember.js';
import { Guild } from '@models/guild.js';
import { GuildMember } from '@models/guildMember.js';
import type { Guild as DiscordGuild } from 'discord.js';
import { Events } from 'discord.js';

export const name = Events.GuildDelete;
export async function execute(guild: DiscordGuild): Promise<void> {
	console.log(`Left guild ${guild.name} (${guild.id})`);

	await Guild.destroy({
		where: {
			id: guild.id,
		},
	});
	await GuildMember.destroy({
		where: {
			guildId: guild.id,
		},
	});
	await BannedMember.destroy({
		where: {
			guildId: guild.id,
		},
	});
}
