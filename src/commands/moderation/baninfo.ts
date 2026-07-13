import { SlashCommandBuilder } from '@discordjs/builders';
import { BannedMember } from '@models/bannedMember.js';
import { createSupportButton } from '@utils/buttons.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('baninfo')
	.setDescription("Get information about a user's ban status on this server.")
	.setDescriptionLocalizations({
		'en-US': "Get information about a user's ban status on this server.",
		'ja': 'このサーバにおけるユーザの禁止ステータスに関する情報を取得します。',
		'zh-CN': '获取用户在本服务器上的停权状态信息。',
		'zh-TW': '取得使用者在此伺服器上的停權狀態資訊。',
	})
	.addStringOption(option =>
		option
			.setName('username')
			.setDescription('The username of the user to get information about.')
			.setDescriptionLocalizations({
				'en-US': 'The username of the user to get information about.',
				'ja': '情報を取得するユーザーのユーザー名。',
				'zh-CN': '要获取信息的用户的用户名。',
				'zh-TW': '要取得資訊的使用者的使用者名稱。',
			})
			.setRequired(true)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const userNeverBannedMessage = i18next.t('banInfo.userNeverBannedMessage');

	if (!interaction.guild) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const username = interaction.options.getString('username', true);
	const bannedMember = await BannedMember.findOne({
		where: {
			guildId: interaction.guild.id,
			username: username,
		},
	});
	if (!bannedMember) {
		await interaction.reply({
			content: userNeverBannedMessage,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await setPublicInteractionLanguage(interaction);

	const neverLiteral = i18next.t('global.neverLiteral');
	const userLiteral = i18next.t('global.userLiteral');
	const userIdLiteral = i18next.t('global.userIdLiteral');
	const issuerLiteral = i18next.t('global.issuerLiteral');
	const reasonLiteral = i18next.t('global.reasonLiteral');
	const fetchedByFooter = i18next.t('global.fetchedByFooter');
	const banInformationLiteral = i18next.t('banInfo.banInformationLiteral');
	const userIsBannedMessage = i18next.t('banInfo.userIsBannedMessage');
	const userIsNotBannedMessage = i18next.t('banInfo.userIsNotBannedMessage');
	const description = bannedMember.isBanned ? userIsBannedMessage : userIsNotBannedMessage;
	const banInfoEmbedBannedAtTitle = i18next.t('banInfo.banInfoEmbedBannedAtTitle');
	const banInfoEmbedExpireDateTitle = i18next.t('banInfo.banInfoEmbedExpireDateTitle');
	const banInfoEmbedTotalBansTitle = i18next.t('banInfo.banInfoEmbedTotalBansTitle');

	const expireDate = bannedMember.bannedUntil ?? neverLiteral;

	const banInfoEmbed = new EmbedBuilder()
		.setColor('#FF0000')
		.setTitle(banInformationLiteral)
		.setDescription(description)
		.addFields([
			{
				name: userLiteral,
				value: `<@${bannedMember.id}>`,
				inline: true,
			},
			{
				name: userIdLiteral,
				value: `\`\`\`${bannedMember.id}\`\`\``,
				inline: true,
			},
		])
		.setTimestamp()
		.setFooter({
			text: fetchedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	if (bannedMember.isBanned) {
		banInfoEmbed
			.addFields([
				{
					name: '\u200B',
					value: '\u200B',
				},
				{
					name: issuerLiteral,
					value: `<@${interaction.user.id}>`,
					inline: true,
				},
				{
					name: reasonLiteral,
					value: `${bannedMember.bannedReason}`,
					inline: true,
				},
				{
					name: '\u200B',
					value: '\u200B',
				},
				{
					name: banInfoEmbedBannedAtTitle,
					value: `${bannedMember.bannedAt}`,
					inline: true,
				},
				{
					name: banInfoEmbedExpireDateTitle,
					value: `${expireDate}`,
					inline: true,
				},
			]);
	}

	banInfoEmbed
		.addFields([
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: banInfoEmbedTotalBansTitle,
				value: `${bannedMember.totalBans}`,
				inline: true,
			},
		]);

	await interaction.reply({
		embeds: [banInfoEmbed],
		components: [createSupportButton()],
	});
}
