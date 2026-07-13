import { SlashCommandBuilder } from '@discordjs/builders';
import { BannedMember } from '@models/bannedMember.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('unban')
	.setDescription('Unban selected user that is banned from the server.')
	.setDescriptionLocalizations({
		'en-US': 'Unban selected user that is banned from the server.',
		'ja': 'サーバーから追放されているユーザーを選択し、追放を解除します。',
		'zh-CN': '解除所选用户的伺服器封禁。',
		'zh-TW': '解除所選使用者的伺服器封禁。',
	})
	.addStringOption(option =>
		option
			.setName('username')
			.setDescription('The username of the user to unban.')
			.setDescriptionLocalizations({
				'en-US': 'The username of the user to unban.',
				'ja': 'アクセス禁止を解除するユーザのユーザ名。',
				'zh-CN': '要解禁的用户的用户名。',
				'zh-TW': '要解禁的使用者的使用者名稱。',
			})
			.setRequired(true)
	)
	.addBooleanOption(option =>
		option
			.setName('notice')
			.setDescription('Try to inform the user that they have been unbanned. Defaults to true, TRUE!')
			.setDescriptionLocalizations({
				'en-US': 'Try to inform the user that they have been unbanned. Defaults to true, TRUE!',
				'ja': 'ユーザーに禁止解除を通知する。 デフォルトはTRUE！',
				'zh-CN': '通知用户他们已被解除停权。 默认为true，TRUE！',
				'zh-TW': '通知使用者他們已被解除停權。 預設為true，TRUE！',
			})
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const banManagePermissionError = i18next.t('unban.banManagePermissionError');
	const bannedUserNotFoundError = i18next.t('unban.bannedUserNotFoundError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
		await interaction.reply({
			content: banManagePermissionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const username = interaction.options.getString('username', true);
	const notice = interaction.options.getBoolean('notice') || true;
	const bannedMember = await BannedMember.findOne({
		where: {
			username: username,
			isBanned: true,
			guildId: interaction.guild.id,
		},
	});

	if (!bannedMember) {
		await interaction.reply({
			content: bannedUserNotFoundError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await setPublicInteractionLanguage(interaction);

	const unbanEmbedTitle = i18next.t('unban.unbanEmbedTitle');
	const userLiteral = i18next.t('global.userLiteral');
	const usernameLiteral = i18next.t('global.usernameLiteral');
	const issuerLiteral = i18next.t('global.issuerLiteral');
	const unbanEmbedFooter = i18next.t('unban.unbanEmbedFooter');
	const unbannedNotice = i18next.t('unban.unbanNotice', {
		issuer: interaction.user.id,
		serverName: interaction.guild.name,
	});

	const user = await interaction.client.users.fetch(bannedMember.id);

	const unbanEmbed = new EmbedBuilder()
		.setColor('#5865F2')
		.setTitle(unbanEmbedTitle)
		.addFields([
			{
				name: userLiteral,
				value: `${user}`,
				inline: true,
			},
			{
				name: usernameLiteral,
				value: `${user.username}`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: issuerLiteral,
				value: `<@${interaction.user.id}>`,
				inline: true,
			},
		])
		.setTimestamp()
		.setFooter({
			text: unbanEmbedFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	if (!user.bot && notice) {
		await user.send(unbannedNotice).catch(() => {});
	}

	await bannedMember.update({
		isBanned: false,
		bannedBy: null,
		bannedReason: null,
		bannedAt: null,
		bannedUntil: null,
	});

	await interaction.reply({
		embeds: [unbanEmbed],
		components: [createSupportButton()],
	});
	await interaction.guild.members.unban(bannedMember.id);

	await sendLog(interaction.guild, {
		embeds: [unbanEmbed],
	});
}
