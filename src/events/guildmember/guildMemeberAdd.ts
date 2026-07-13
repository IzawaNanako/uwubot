import { BannedMember } from '@models/bannedMember.js';
import { Guild } from '@models/guild.js';
import { GuildMember } from '@models/guildMember.js';
import { User } from '@models/user.js';
import { WelcomeRole } from '@models/welcomeRole.js';
import type { GuildMember as Member, TextChannel } from 'discord.js';
import { ChannelType, EmbedBuilder, Events, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const name = Events.GuildMemberAdd;
export async function execute(member: Member): Promise<void> {
	if (member.user.bot) {
		return;
	}

	try {
		await User.findOrCreate({
			where: {
				id: member.id,
			},
		});
	} catch (error) {
		console.error(`Error registering user ${member.id}:`, error);
	}

	const [guild] = await Guild.findOrCreate({
		where: {
			id: member.guild.id,
		},
	});

	i18next.setDefaultNamespace('events');
	await i18next.changeLanguage(guild.language);
	const welcomeEmbedTitle = i18next.t('guildMemberAdd.welcomeEmbedTitle', {
		userDisplayName: member.user.username,
	});
	const welcomeEmbedFooter = i18next.t('guildMemberAdd.welcomeEmbedFooter');
	const welcomeEmbedWasKicked = i18next.t('guildMemberAdd.welcomeEmbedWasKicked');
	const welcomeEmbedWasBanned = i18next.t('guildMemberAdd.welcomeEmbedWasBanned');

	const [guildMember] = await GuildMember.findOrCreate({
		where: {
			id: member.user.id,
			guildId: member.guild.id,
		},
	});
	const bannedMember = await BannedMember.findOne({
		where: {
			id: member.user.id,
			guildId: member.guild.id,
		},
	});
	const welcomeRoles = await WelcomeRole.findAll({
		where: {
			guildId: member.guild.id,
		},
	});

	let welcomeChannel: TextChannel | null | undefined;
	if (guild.welcomeChannelId) {
		const fetchedChannel = await member.guild.channels.fetch(guild.welcomeChannelId);

		if (fetchedChannel?.type === ChannelType.GuildText) {
			welcomeChannel = fetchedChannel;
		}
	}

	if (guild.welcomeChannelId && welcomeChannel && member.guild.members.me?.permissionsIn(guild.welcomeChannelId).has(PermissionFlagsBits.SendMessages) && member.guild.members.me.permissionsIn(guild.welcomeChannelId).has(PermissionFlagsBits.ViewChannel)) {
		const welcomeMessage = guild.welcomeMessage
			.replace('<[user]>', `<@${member.user.id}>`)
			.replace('<[username]>', member.user.username)
			.replace('<[userDisplayName]>', member.user.displayName)
			.replace('<[userId]>', member.user.id)
			.replace('<[serverName]>', member.guild.name)
			.replace('<[memberCount]>', member.guild.memberCount.toString());

		const welcomeEmbed = new EmbedBuilder()
			.setColor('#2E4053')
			.setAuthor({
				name: `Yo ${member.user.username}!`,
				iconURL: member.user.displayAvatarURL(),
			})
			.setTitle(welcomeEmbedTitle)
			.setThumbnail(member.guild.iconURL())
			.setFooter({
				text: welcomeEmbedFooter,
				iconURL: member.client.user.displayAvatarURL(),
			})
			.setTimestamp();

		/**
		 * Gets the description for the welcome message based on the member's status.
		 */
		async function getWelcomeDescription(): Promise<string> {
			if (guildMember?.isKicked) {
				guildMember.isKicked = false;
				await guildMember.save();
				return welcomeEmbedWasKicked;
			}

			if (bannedMember?.isBanned && bannedMember?.totalBans > 0) {
				return welcomeEmbedWasBanned;
			}

			return welcomeMessage;
		}

		const description = await getWelcomeDescription();
		welcomeEmbed.setDescription(description);
	}

	if (welcomeRoles.length > 0 && member.guild.members.me && member.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
		for (const role of welcomeRoles) {
			const welcomeRole = await member.guild.roles.fetch(role.id);
			if (welcomeRole) {
				await member.roles.add(role.id).catch(() => {});
			}
		}
	}
}
