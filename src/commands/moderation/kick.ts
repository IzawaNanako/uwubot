import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember } from '@models/guildMember.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('kick')
	.setDescription('Kick selected member from the server.')
	.setDescriptionLocalizations({
		'en-US': 'Kick selected member from the server.',
		'ja': '選択したメンバーをサーバーからキックする。',
		'zh-CN': '从服务器上踢出所选成员。',
		'zh-TW': '從伺服器踢出所選的成員。',
	})
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to kick.')
			.setDescriptionLocalizations({
				'en-US': 'The user to kick.',
				'ja': 'キックするユーザー。',
				'zh-CN': '要踢出的用户。',
				'zh-TW': '要踢出的使用者。',
			})
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('reason')
			.setDescription('The reason you are kicking this user for.')
			.setDescriptionLocalizations({
				'en-US': 'The reason you are kicking this user for.',
				'ja': 'このユーザーをキックする理由。',
				'zh-CN': '您踢出这位用户的原因。',
				'zh-TW': '您踢出該使用者的原因。',
			})
	)
	.addBooleanOption(option =>
		option
			.setName('notice')
			.setDescription('Try to inform the user that they have been kicked. Defaults to false.')
			.setDescriptionLocalizations({
				'en-US': 'Try to inform the user that they have been kicked. Defaults to false.',
				'ja': 'ユーザーにキックされたことを通知する。 デフォルトはfalse。',
				'zh-CN': '通知用户已被踢出。 默认为 false。',
				'zh-TW': '通知使用者已被踢出。 預設為 false。',
			})
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const kickPermissionError = i18next.t('kick.kickPermissionError');
	const invalidUserError = i18next.t('global.invalidUserError');
	const kickingThemselvesError = i18next.t('kick.kickingThemselvesError');
	const failedToKickError = i18next.t('kick.failedToKickError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
		await interaction.reply({
			content: kickPermissionError,
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
	const reason = interaction.options.getString('reason');
	const notice = interaction.options.getBoolean('notice') || false;
	const [guildMember] = await GuildMember.findOrCreate({
		where: {
			id: user.id,
			guildId: interaction.guild.id,
		},
	});

	if (user.id === interaction.user.id) {
		await interaction.reply({
			content: kickingThemselvesError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!member.kickable) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor('#FF0000')
					.setDescription(failedToKickError),
			],
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply();

	await setPublicInteractionLanguage(interaction);

	const kickEmbedTitle = i18next.t('kick.kickEmbedTitle');
	const userLiteral = i18next.t('global.userLiteral');
	const usernameLiteral = i18next.t('global.usernameLiteral');
	const issuerLiteral = i18next.t('global.issuerLiteral');
	const reasonLiteral = i18next.t('global.reasonLiteral');
	const kickEmbedFooter = i18next.t('kick.kickEmbedFooter');
	const kickNotice = i18next.t('kick.kickNotice', {
		issuer: interaction.user,
		serverName: interaction.guild.name,
	});
	const kickNoticeReason = i18next.t('kick.kickNoticeReason', {
		reason: reason,
	});
	const kickRandomTextOne = i18next.t('kick.kickRandomTextOne');
	const kickRandomTextTwo = i18next.t('kick.kickRandomTextTwo');
	const kickRandomTextThree = i18next.t('kick.kickRandomTextThree');
	const kickRandomTextFour = i18next.t('kick.kickRandomTextFour');
	const kickRandomTextFive = i18next.t('kick.kickRandomTextFive');

	const kickMsgID = Math.floor(Math.random() * 5);
	const kickMsgs = [
		kickRandomTextOne,
		kickRandomTextTwo,
		kickRandomTextThree,
		kickRandomTextFour,
		kickRandomTextFive,
	] as const;

	const kickEmbed = new EmbedBuilder()
		.setColor('#FF0000')
		.setTitle(kickEmbedTitle)
		.setDescription(kickMsgs[kickMsgID] ?? kickRandomTextOne)
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
		])
		.setImage('https://i.imgur.com/3RiBEiw.gif')
		.setTimestamp()
		.setFooter({
			text: kickEmbedFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	let kickedNotice = kickNotice;

	if (reason) {
		kickedNotice += kickNoticeReason;
		kickEmbed
			.addFields({
				name: reasonLiteral,
				value: reason,
				inline: true,
			});
	}

	if (!member.user.bot && notice) {
		await member.send(kickedNotice).catch(() => {});
	}

	await guildMember.update({
		isKicked: true,
	});

	await interaction.editReply({
		embeds: [kickEmbed],
		components: [createSupportButton()],
	});
	await member.kick();

	await sendLog(interaction.guild, {
		embeds: [kickEmbed],
	});
}
