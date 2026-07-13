import { Guild } from '@models/guild.js';
import type { Guild as DiscordGuild, MessageCreateOptions, MessagePayload, TextChannel } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';

/**
 * Send a log to the log channel of the selected guild.
 * @param message The message to send. Format is the same as for the `TextChannel#send` method.
 */
export async function sendLog(guild: DiscordGuild, message: string | MessagePayload | MessageCreateOptions): Promise<void> {
	const guildData = await Guild.findOne({
		where: {
			id: guild.id,
		},
	});

	if (guildData?.logChannelId && guild.members.me?.permissionsIn(guildData.logChannelId).has(PermissionFlagsBits.SendMessages)) {
		const logChannel = guild.channels.cache.get(guildData.logChannelId) as TextChannel;
		if (logChannel) {
			await logChannel.send(message);
		}
	}
}
