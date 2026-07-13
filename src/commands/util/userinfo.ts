import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DiscordAPIError, EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

/**
 * Mapping of badge names to their corresponding emoji.
 */
const badgeMap: { [key: string]: string } = {
	'HypeSquadOnlineHouse1': '<:HypeSquadBravery:1295711346931007530>',
	'HypeSquadOnlineHouse2': '<:HypeSquadBrilliance:1295711381622095904>',
	'HypeSquadOnlineHouse3': '<:HypeSquadBalance:1295711412294778931>',
	'Hypesquad': '<:HypeSquadEvents:1296418614336815215>',
	'ActiveDeveloper': '<:ActiveDeveloper:1295710776014667817>',
	'VerifiedDeveloper': '<:EarlyVerifiedBotDeveloper:1295710584330915902>',
	'BugHunterLevel1': '<:DiscordBugHunter:1295711456355942401>',
	'BugHunterLevel2': '<:DiscordGoldenBugHunter:1295711509594509358>',
	'Staff': '<:DiscordStaff:1295711569631510630>',
	'PremiumEarlySupporter': '<:EarlySupporter:1295711627395469323>',
	'Partner': '<:PartneredServerOwner:1295711670898921482>',
	'CertifiedModerator': '<:ModeratorProgramAlumni:1295711596865388584>',
	'VerifiedBot': '<:Verified:1295712821358759967>',
};

export const data = new SlashCommandBuilder()
	.setName('userinfo')
	.setDescription('Display information about the selected user. Certain info can only be seen if user is in the server.')
	.setDescriptionLocalizations({
		'en-US': 'Display information about the selected user. Certain info can only be seen if user is in the server.',
		'ja': '選択したユーザーに関する情報を表示する。 特定の情報は、ユーザーがサーバー内にいる場合にのみ表示されます。',
		'zh-CN': '显示所选用户的信息。 某些信息只有用户在服务器中时才能看到。',
		'zh-TW': '顯示所選使用者的相關資訊。 某些資訊只有使用者在伺服器中時才能看到。',
	})
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to display information about.')
			.setDescriptionLocalizations({
				'en-US': 'The user to display information about.',
				'ja': 'ユーザーに関する情報を表示する。',
				'zh-CN': '要显示信息的用户。',
				'zh-TW': '要顯示資訊的使用者。',
			})
	);
export async function execute(interaction: ChatInputCommandInteraction) {
	await setInteractionLanguage(interaction);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const unknownError = i18next.t('global.unknownError');
	const noneLiteral = i18next.t('global.noneLiteral');
	const unknownLiteral = i18next.t('global.unknownLiteral');
	const fetchedByFooter = i18next.t('global.fetchedByFooter');
	const usernameLiteral = i18next.t('global.usernameLiteral');
	const userIdLiteral = i18next.t('global.userIdLiteral');
	const badgesLiteral = i18next.t('userInfo.badgesLiteral');
	const statusLiteral = i18next.t('userInfo.statusLiteral');
	const rolesLiteral = i18next.t('userInfo.rolesLiteral');
	const joinedServerAtLiteral = i18next.t('userInfo.joinedServerAtLiteral');
	const createdAtLiteral = i18next.t('userInfo.createdAtLiteral');
	const offlineLiteral = i18next.t('userInfo.offlineLiteral');
	const dndLiteral = i18next.t('userInfo.dndLiteral');
	const idleLiteral = i18next.t('userInfo.idleLiteral');
	const onlineLiteral = i18next.t('userInfo.onlineLiteral');
	const userInfoRandomTextOne = i18next.t('userInfo.userInfoRandomTextOne');
	const userInfoRandomTextTwo = i18next.t('userInfo.userInfoRandomTextTwo');
	const userInfoRandomTextThree = i18next.t('userInfo.userInfoRandomTextThree');
	const userInfoRandomTextFour = i18next.t('userInfo.userInfoRandomTextFour');
	const userInfoRandomTextFive = i18next.t('userInfo.userInfoRandomTextFive');

	const user = interaction.options.getUser('user') || interaction.user;

	const userInfoEmbeddTitle = i18next.t('userInfo.userInfoEmbedTitle', {
		userDisplayName: user.displayName,
	});

	const createdAtTimestamp = Math.floor(user.createdAt.getTime() / 1000);
	if (!user.flags) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const guildMember = await interaction.guild?.members.fetch(user.id).catch((error: unknown) => {
		if (!(error instanceof DiscordAPIError && error.code === 10007)) {
			console.error(error);
		}

		return null;
	});
	const badges = user.flags.toArray()
		.map((badge) => badgeMap[badge] ?? '')
		.join(' ') || noneLiteral;
	const roles = guildMember ? guildMember.roles.cache.map(role => role.name === '@everyone' ? 'everyone' : `<@&${role.id}>`).join(', ') : 'N/A';
	const joinedAt = guildMember?.joinedAt ? `<t:${Math.floor(guildMember.joinedAt.getTime() / 1000)}>` : 'N/A';
	const statusMap: Record<string, string> = {
		online: onlineLiteral,
		idle: idleLiteral,
		dnd: dndLiteral,
		offline: offlineLiteral,
	} as const;
	const status = !guildMember ? unknownLiteral : statusMap[guildMember.presence?.status ?? 'offline'] ?? offlineLiteral;

	const infoTextNum = Math.floor(Math.random() * 5);
	const infoTexts = [
		userInfoRandomTextOne,
		userInfoRandomTextTwo,
		userInfoRandomTextThree,
		userInfoRandomTextFour,
		userInfoRandomTextFive,
	] as const;

	const userInfoEmbed = new EmbedBuilder()
		.setColor('#03A9F4')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(userInfoEmbeddTitle)
		.setDescription(infoTexts[infoTextNum] ?? userInfoRandomTextOne)
		.setThumbnail(user.displayAvatarURL())
		.addFields([
			{
				name: usernameLiteral,
				value: `${user.username}`,
				inline: true,
			},
			{
				name: userIdLiteral,
				value: `\`\`\`${user.id}\`\`\``,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: badgesLiteral,
				value: `${badges}`,
				inline: true,
			},
			{
				name: statusLiteral,
				value: `${status}`,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
			},
			{
				name: rolesLiteral,
				value: `${roles}`,
				inline: true,
			},
			{
				name: joinedServerAtLiteral,
				value: `${joinedAt}`,
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
		embeds: [userInfoEmbed],
		components: [createSupportButton()],
	});
}
