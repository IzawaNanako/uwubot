import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('serverinfo')
	.setDescription('Display information about a server the bot is in.')
	.setDescriptionLocalizations({
		'en-US': 'Display information about a server the bot is in.',
		'ja': 'ボットがサーバーにいる場合、サーバーに関する情報を表示する。',
		'zh-CN': '显示一个机器人在其中的伺服器的相关资讯。',
		'zh-TW': '顯示一個機器人在其中的伺服器的相關資訊。',
	})
	.addStringOption(option =>
		option
			.setName('server-id')
			.setDescription('The ID of the server to display information about. "/help ids" for how to get IDs.')
			.setDescriptionLocalizations({
				'en-US': 'The ID of the server to display information about. "/help ids" for how to get IDs.',
				'ja': '情報を表示するサーバーのID。IDの取得方法は"/help ids"を参照。',
				'zh-CN': '要显示相关信息的服务器ID。 关于如何获取ID，请参见"/help ids"。',
				'zh-TW': '要顯示資訊的伺服器ID。"/help ids"說明如何取得ID。',
			})
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const fetchedByFooter = i18next.t('global.fetchedByFooter');
	const invalidServerError = i18next.t('serverInfo.invalidServerError');
	const serverInformationLiteral = i18next.t('serverInfo.serverInformationLiteral');
	const serverNameLiteral = i18next.t('serverInfo.serverNameLiteral');
	const serverOwnerLiteral = i18next.t('serverInfo.serverOwnerLiteral');
	const serverIdLiteral = i18next.t('serverInfo.serverIdLiteral');
	const totalMembersLiteral = i18next.t('serverInfo.totalMembersLiteral');
	const boostCountLiteral = i18next.t('serverInfo.boostCountLiteral');
	const boostLevelLiteral = i18next.t('serverInfo.boostLevelLiteral');
	const roleCountLiteral = i18next.t('serverInfo.roleCountLiteral');
	const channelCountLiteral = i18next.t('serverInfo.channelCountLiteral');
	const customEmojiCountLiteral = i18next.t('serverInfo.customEmojiCountLiteral');
	const createdAtLiteral = i18next.t('serverInfo.createdAtLiteral');
	const serverInfoRandomTextOne = i18next.t('serverInfo.serverInfoRandomTextOne');
	const serverInfoRandomTextTwo = i18next.t('serverInfo.serverInfoRandomTextTwo');
	const serverInfoRandomTextThree = i18next.t('serverInfo.serverInfoRandomTextThree');
	const serverInfoRandomTextFour = i18next.t('serverInfo.serverInfoRandomTextFour');
	const serverInfoRandomTextFive = i18next.t('serverInfo.serverInfoRandomTextFive');

	const serverId = interaction.options.getString('server-id') || interaction.guild?.id;

	const server = serverId ? await interaction.client.guilds.fetch(serverId).catch(() => null) : null;

	if (!server) {
		await interaction.reply({
			content: invalidServerError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const createdAtTimestamp = Math.floor(server.createdAt.getTime() / 1000);
	const owner = await server.members.fetch(server.ownerId);

	const infoTextNum = Math.floor(Math.random() * 5);
	const infoTexts = [
		serverInfoRandomTextOne,
		serverInfoRandomTextTwo,
		serverInfoRandomTextThree,
		serverInfoRandomTextFour,
		serverInfoRandomTextFive,
	] as const;

	const serverInfoEmbed = new EmbedBuilder()
		.setColor('#2E4053')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(serverInformationLiteral)
		.setDescription(infoTexts[infoTextNum] ?? serverInfoRandomTextOne)
		.setThumbnail(server.iconURL())
		.addFields([
			{
				name: serverNameLiteral,
				value: `${server.name}`,
				inline: true,
			},
			{
				name: serverOwnerLiteral,
				value: `<@${owner.user.id}>`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: serverIdLiteral,
				value: `\`\`\`${server.id}\`\`\``,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: totalMembersLiteral,
				value: `${server.memberCount}`,
				inline: true,
			},
			{
				name: boostCountLiteral,
				value: `${server.premiumSubscriptionCount}`,
				inline: true,
			},
			{
				name: boostLevelLiteral,
				value: `${server.premiumTier}`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: roleCountLiteral,
				value: `${server.roles.cache.size}`,
				inline: true,
			},
			{
				name: channelCountLiteral,
				value: `${server.channels.cache.size}`,
				inline: true,
			},
			{
				name: customEmojiCountLiteral,
				value: `${server.emojis.cache.size}`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: createdAtLiteral,
				value: `<t:${createdAtTimestamp}>`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
		])
		.setFooter({
			text: fetchedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await interaction.reply({
		embeds: [serverInfoEmbed],
		components: [createSupportButton()],
	});
}
