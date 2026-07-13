import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember } from '@models/guildMember.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('mute')
	.setDescription('Timeout selected member.')
	.setDescriptionLocalizations({
		'en-US': 'Timeout selected member.',
		'ja': '選択したメンバーをタイムアウト（ミュート）する。',
		'zh-CN': '禁言所选成员。',
		'zh-TW': '禁言所選的成員。',
	})
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to mute.')
			.setDescriptionLocalizations({
				'en-US': 'The user to mute.',
				'ja': 'ミュートするユーザー。',
				'zh-CN': '要禁言的用户。',
				'zh-TW': '要禁言的使用者。',
			})
			.setRequired(true)
	)
	.addIntegerOption(option =>
		option
			.setName('duration')
			.setDescription('Duration of the mute in minutes.')
			.setDescriptionLocalizations({
				'en-US': 'Duration of the mute in minutes.',
				'ja': 'ミュートの期間（分）。',
				'zh-CN': '禁言持续时间（分钟）。',
				'zh-TW': '禁言持續時間（分鐘）。',
			})
			.setRequired(true)
			.setMinValue(1)
			.setMaxValue(40320)
	)
	.addStringOption(option =>
		option
			.setName('reason')
			.setDescription('The reason you are muting this user for.')
			.setDescriptionLocalizations({
				'en-US': 'The reason you are muting this user for.',
				'ja': 'このユーザーをミュートする理由。',
				'zh-CN': '您禁言这位用户的原因。',
				'zh-TW': '您禁言該使用者的原因。',
			})
	)
	.addBooleanOption(option =>
		option
			.setName('notice')
			.setDescription('Try to inform the user that they have been muted. Defaults to false.')
			.setDescriptionLocalizations({
				'en-US': 'Try to inform the user that they have been muted. Defaults to false.',
				'ja': 'ユーザーにミュートされたことを通知する。 デフォルトはfalse。',
				'zh-CN': '通知用户已被禁言。 默认为 false。',
				'zh-TW': '通知使用者已被禁言。 預設為 false。',
			})
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const mutePermissionError = i18next.t('mute.mutePermissionError');
	const invalidUserError = i18next.t('global.invalidUserError');
	const mutingThemselvesError = i18next.t('mute.mutingThemselvesError');
	const failedToMuteError = i18next.t('mute.failedToMuteError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
		await interaction.reply({
			content: mutePermissionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const user = interaction.options.getUser('user', true);
	if (!user) {
		await interaction.reply({
			content: invalidUserError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const member = await interaction.guild.members.fetch(user.id);
	const duration = interaction.options.getInteger('duration', true);
	const reason = interaction.options.getString('reason');
	const notice = interaction.options.getBoolean('notice') || false;

	await GuildMember.findOrCreate({
		where: {
			id: user.id,
			guildId: interaction.guild.id,
		},
	});

	if (user.id === interaction.user.id) {
		await interaction.reply({
			content: mutingThemselvesError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!member.moderatable) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor('#FF0000')
					.setDescription(failedToMuteError),
			],
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply();

	await setPublicInteractionLanguage(interaction);

	const muteEmbedTitle = i18next.t('mute.muteEmbedTitle');
	const userLiteral = i18next.t('global.userLiteral');
	const usernameLiteral = i18next.t('global.usernameLiteral');
	const issuerLiteral = i18next.t('global.issuerLiteral');
	const reasonLiteral = i18next.t('global.reasonLiteral');
	const durationLiteral = i18next.t('global.durationLiteral');
	const muteEmbedFooter = i18next.t('mute.muteEmbedFooter');
	const muteNotice = i18next.t('mute.muteNotice', {
		issuer: interaction.user,
		serverName: interaction.guild.name,
		duration: duration,
	});
	const muteNoticeReason = i18next.t('mute.muteNoticeReason', {
		reason: reason,
	});
	const noReasonMessage = i18next.t('mute.noReasonMessage');
	const muteRandomTextOne = i18next.t('mute.muteRandomTextOne');
	const muteRandomTextTwo = i18next.t('mute.muteRandomTextTwo');
	const muteRandomTextThree = i18next.t('mute.muteRandomTextThree');
	const muteRandomTextFour = i18next.t('mute.muteRandomTextFour');
	const muteRandomTextFive = i18next.t('mute.muteRandomTextFive');
	const muteMinutesLiteral = i18next.t('mute.muteMinutesLiteral');

	const muteMsgID = Math.floor(Math.random() * 5);
	const muteMsgs = [
		muteRandomTextOne,
		muteRandomTextTwo,
		muteRandomTextThree,
		muteRandomTextFour,
		muteRandomTextFive,
	] as const;

	const muteEmbed = new EmbedBuilder()
		.setColor('#FFA500')
		.setTitle(muteEmbedTitle)
		.setDescription(muteMsgs[muteMsgID] ?? muteRandomTextOne)
		.addFields([
			{
				name: userLiteral,
				value: `<@${member.user.id}>`,
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
			{
				name: durationLiteral,
				value: `${duration} ${muteMinutesLiteral}`,
				inline: true,
			},
		])
		.setImage('https://i.imgur.com/hDnVnrm.png')
		.setTimestamp()
		.setFooter({
			text: muteEmbedFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	let mutedNotice = muteNotice;

	if (reason) {
		mutedNotice += muteNoticeReason;
		muteEmbed.addFields({
			name: reasonLiteral,
			value: reason,
			inline: true,
		});
	}

	if (!member.user.bot && notice) {
		await member.send(mutedNotice).catch(() => {});
	}

	await member.timeout(duration * 60 * 1000, reason || noReasonMessage);

	await interaction.editReply({
		embeds: [muteEmbed],
		components: [createSupportButton()],
	});

	await sendLog(interaction.guild, {
		embeds: [muteEmbed],
	});
}
