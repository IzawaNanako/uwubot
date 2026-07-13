import { BannedMember } from '@models/bannedMember.js';
import { Guild } from '@models/guild.js';
import { GuildMember } from '@models/guildMember.js';
import type { GuildMember as Member } from 'discord.js';
import { ChannelType, EmbedBuilder, Events, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const name = Events.GuildMemberRemove;
export async function execute(member: Member): Promise<void> {
	if (member === member.guild.members.me) {
		return;
	}

	const [guild] = await Guild.findOrCreate({
		where: {
			id: member.guild.id,
		},
	});
	if (!guild.byeChannelId || (member.guild.members.me && (!member.guild.members.me.permissionsIn(guild.byeChannelId).has(PermissionFlagsBits.SendMessages) || !member.guild.members.me.permissionsIn(guild.byeChannelId).has(PermissionFlagsBits.ViewChannel)))) {
		return;
	}

	i18next.setDefaultNamespace('events');
	await i18next.changeLanguage(guild.language);
	const byeEmbedAuthor = i18next.t('guildMemberRemove.byeEmbedAuthor', {
		username: member.user.username,
	});
	const byeEmbedTitle = i18next.t('guildMemberRemove.byeEmbedTitle', {
		userDisplayName: member.user.username,
	});
	const byeEmbedFooter = i18next.t('guildMemberRemove.byeEmbedFooter');

	const byeChannel = await member.guild.channels.fetch(guild.byeChannelId);
	if (!byeChannel || byeChannel.type !== ChannelType.GuildText) {
		return;
	}

	const guildMember = await GuildMember.findOne({
		where: {
			id: member.id,
			guildId: member.guild.id,
		},
	});
	const bannedMember = await BannedMember.findOne({
		where: {
			id: member.id,
			guildId: member.guild.id,
		},
	});
	if (guildMember?.isKicked || bannedMember?.isBanned) {
		return;
	}

	const byeMessage = guild.byeMessage
		.replace('<[user]>', `<@${member.user.id}>`)
		.replace('<[username]>', member.user.username)
		.replace('<[userDisplayName]>', member.user.displayName)
		.replace('<[userId]>', member.user.id)
		.replace('<[serverName]>', member.guild.name)
		.replace('<[memberCount]>', (member.guild.memberCount - 1).toString());

	const byeEmbed = new EmbedBuilder()
		.setColor('#FF0000')
		.setAuthor({
			name: byeEmbedAuthor,
			iconURL: member.user.displayAvatarURL(),
		})
		.setTitle(byeEmbedTitle)
		.setThumbnail(member.guild.iconURL())
		.setDescription(byeMessage)
		.setFooter({
			text: byeEmbedFooter,
			iconURL: member.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await byeChannel.send({
		embeds: [byeEmbed],
	});
}
