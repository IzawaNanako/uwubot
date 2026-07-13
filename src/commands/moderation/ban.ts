import { SlashCommandBuilder } from '@discordjs/builders';
import { BannedMember } from '@models/bannedMember.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';
import schedule from 'node-schedule';

export const data = new SlashCommandBuilder()
	.setName('ban')
	.setDescription('Ban selected member from the server.')
	.setDescriptionLocalizations({
		'en-US': 'Ban selected member from the server.',
		'ja': '選択したメンバーをサーバーから追放する。',
		'zh-CN': '从服务器中停权所选成员。',
		'zh-TW': '從伺服器停權所選成員。',
	})
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to ban.')
			.setDescriptionLocalizations({
				'en-US': 'The user to ban.',
				'ja': '禁止するユーザー。',
				'zh-CN': '要停权的用户。',
				'zh-TW': '要停權的使用者。',
			})
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('reason')
			.setDescription('The reason you are banning this user for.')
			.setDescriptionLocalizations({
				'en-US': 'The reason you are banning this user for.',
				'ja': 'このユーザーを追放する理由。',
				'zh-CN': '您停权该用户的原因。',
				'zh-TW': '您停權此使用者的原因。',
			})
	)
	.addNumberOption(option =>
		option
			.setName('delete_messages')
			.setDescription('Since how long ago you want to delete their messages, in days? (Max 7, default 0, accept decimals)')
			.setDescriptionLocalizations({
				'en-US': 'Since how long ago you want to delete their messages, in days? (Max 7, default 0, accept decimals)',
				'ja': '何日前からのメッセージを削除しますか？ (最大7、デフォルト0、小数可)',
				'zh-CN': '以天为单位，您想从多长时间前开始删除他们的信息？ (最多7天，默认为0，接受小数点）',
				'zh-TW': '以天為單位，您想從多長時間前開始刪除他們的資訊？ (最多7天，預設為0，接受小數點）',
			})
			.setMinValue(0)
			.setMaxValue(7)
	)
	.addBooleanOption(option =>
		option
			.setName('notice')
			.setDescription('Try to inform the user that they have been banned. Defaults to false.')
			.setDescriptionLocalizations({
				'en-US': 'Try to inform the user that they have been banned. Defaults to false.',
				'ja': 'ユーザーに禁止されたことを通知する。 デフォルトはfalse。',
				'zh-CN': '通知用户已被封禁。默认为 false。',
				'zh-TW': '通知使用者已被封禁。預設為 false。',
			})
	)
	.addNumberOption(option =>
		option
			.setName('duration')
			.setDescription('How long should the ban last for, in days? (Accepts decimals, leave empty for permanent)')
			.setDescriptionLocalizations({
				'en-US': 'How long should the ban last for in days? (Accepts decimals, leave empty for permanent)',
				'ja': '禁止期間は何日間ですか？ (小数可、永久の場合は空白にしてください）',
				'zh-CN': '以天为单位，禁令应持续多长时间？ (接受小数，留空表示永久）',
				'zh-TW': '以天為單位，禁令應該持續多久？ (接受小數點，留空表示永久）',
			})
			.setMinValue(0)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const banPermissionError = i18next.t('ban.banPermissionError');
	const invalidUserError = i18next.t('global.invalidUserError');
	const banningThemselvesError = i18next.t('ban.banningThemselvesError');
	const failedToBanError = i18next.t('ban.failedToBanError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
		await interaction.reply({
			content: banPermissionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const user = interaction.options.getUser('user', true);
	const delDays = interaction.options.getNumber('delete_messages') || 0;
	const notice = interaction.options.getBoolean('notice') || false;
	const duration = interaction.options.getNumber('duration');
	const reason = interaction.options.getString('reason');
	if (!user) {
		await interaction.reply({
			content: invalidUserError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const member = await interaction.guild.members.fetch(user.id);
	if (!member) {
		await interaction.reply({
			content: invalidUserError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (user.id === interaction.user.id) {
		await interaction.reply({
			content: banningThemselvesError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!member.bannable) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor('#FF0000')
					.setDescription(failedToBanError),
			],
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const [bannedMember] = await BannedMember.findOrCreate({
		where: {
			id: user.id,
			username: user.username,
			guildId: interaction.guild.id,
		},
	});

	await interaction.deferReply();

	await setPublicInteractionLanguage(interaction);

	const banEmbedTitle = i18next.t('ban.banEmbedTitle');
	const userLiteral = i18next.t('global.userLiteral');
	const usernameLiteral = i18next.t('global.usernameLiteral');
	const issuerLiteral = i18next.t('global.issuerLiteral');
	const reasonLiteral = i18next.t('global.reasonLiteral');
	const banEmbedFooter = i18next.t('ban.banEmbedFooter');
	const banEmbedExpireDateTitle = i18next.t('ban.banEmbedExpireDateTitle');
	const neverLiteral = i18next.t('ban.neverLiteral');
	const noReasonMessage = i18next.t('ban.noReasonMessage');
	const banNotice = i18next.t('ban:banNotice', {
		issuer: interaction.user.id,
		serverName: interaction.guild.name,
	});
	const banNoticeReason = i18next.t('ban.banNoticeReason', {
		reason: reason,
	});
	const banRandomTextOne = i18next.t('ban.banRandomTextOne');
	const banRandomTextTwo = i18next.t('ban.banRandomTextTwo');
	const banRandomTextThree = i18next.t('ban.banRandomTextThree');
	const banRandomTextFour = i18next.t('ban.banRandomTextFour');
	const banRandomTextFive = i18next.t('ban.banRandomTextFive');
	const unbanEmbedTitle = i18next.t('unban.unbanEmbedTitle');
	const unbanEmbedFooter = i18next.t('unban.unbanEmbedFooter');
	const banExpiredMessage = i18next.t('ban.banExpiredMessage');

	const banMsgID = Math.floor(Math.random() * 5);
	const banMsgs = [
		banRandomTextOne,
		banRandomTextTwo,
		banRandomTextThree,
		banRandomTextFour,
		banRandomTextFive,
	] as const;

	const banEmbed = new EmbedBuilder()
		.setColor('#FF0000')
		.setTitle(banEmbedTitle)
		.setDescription(banMsgs[banMsgID] ?? banRandomTextOne)
		.addFields([
			{
				name: userLiteral,
				value: `<@${user.id}>`,
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
		.setImage('https://i.imgur.com/ioBFfq3.gif')
		.setTimestamp()
		.setFooter({
			text: banEmbedFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	const finalReason = reason || noReasonMessage;
	let bannedNotice = reason ? `${banNotice}${banNoticeReason}` : `${banNotice}${noReasonMessage}`;

	if (reason) {
		banEmbed.addFields({
			name: reasonLiteral,
			value: reason,
			inline: true,
		});
	}

	const delSecs = Math.round(delDays * 86400);

	await bannedMember.update({
		totalBans: bannedMember.totalBans + 1,
		isBanned: true,
		bannedBy: interaction.user.id,
		bannedReason: reason,
		bannedAt: new Date(),
	});

	if (duration) {
		bannedNotice += ` ${banEmbedExpireDateTitle} ${Date.now() + (duration * 86400000)}`;

		await bannedMember.update({
			bannedUntil: new Date(Date.now() + (duration * 86400000)),
		});

		const guildFetched = await interaction.guild.fetch();

		schedule.scheduleJob(bannedMember.bannedUntil as Date, async () => {
			if (bannedMember.isBanned === false) {
				return;
			}

			const unbanEmbed = new EmbedBuilder()
				.setColor('#FF0000')
				.setTitle(unbanEmbedTitle)
				.addFields([
					{
						name: userLiteral,
						value: `<@${user}>`,
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
						name: reasonLiteral,
						value: banExpiredMessage,
						inline: true,
					},
				])
				.setTimestamp()
				.setFooter({
					text: unbanEmbedFooter,
					iconURL: interaction.client.user.displayAvatarURL(),
				});

			await bannedMember.update({
				isBanned: false,
				bannedUntil: null,
			});
			await guildFetched.members.unban(user);
			await sendLog(guildFetched, {
				embeds: [unbanEmbed],
			});
		});
	}

	banEmbed
		.addFields({
			name: banEmbedExpireDateTitle,
			value: duration ? `${bannedMember.bannedUntil}` : neverLiteral,
			inline: true,
		});

	if (!user.bot && notice) {
		await user.send(bannedNotice).catch(() => {});
	}

	await interaction.guild.members.ban(user, {
		reason: finalReason,
		deleteMessageSeconds: delSecs,
	});

	await interaction.editReply({
		embeds: [banEmbed],
		components: [createSupportButton()],
	});

	await sendLog(interaction.guild, {
		embeds: [banEmbed],
	});
}
