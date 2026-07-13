import { SlashCommandBuilder } from '@discordjs/builders';
import { Guild } from '@models/guild.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage, setPublicInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { ChannelType, EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

type ConfigType = 'log' | 'welcome' | 'bye';
const channelKeyMap: Record<ConfigType, 'logChannelId' | 'welcomeChannelId' | 'byeChannelId'> = {
	'log': 'logChannelId',
	'welcome': 'welcomeChannelId',
	'bye': 'byeChannelId',
};

export const data = new SlashCommandBuilder()
	.setName('set-channel')
	.setDescription('Configure the logs channel and welcome/bye message channels.')
	.setDescriptionLocalizations({
		'en-US': 'Configure the logs channel and welcome/bye message channels.',
		'ja': 'ログチャンネルとウェルカム/バイバイメッセージチャンネルを設定します。',
		'zh-CN': '设置记录频道和欢迎/再见消息频道。',
		'zh-TW': '設定記錄頻道和歡迎/再見訊息頻道。',
	})
	.addSubcommandGroup(group =>
		group
			.setName('log')
			.setDescription('Set the channel to send logs in.')
			.setDescriptionLocalizations({
				'en-US': 'Set the channel to send logs in.',
				'ja': 'ログを送信するチャンネルを設定します。',
				'zh-CN': '设置发送日志的频道。',
				'zh-TW': '設定傳送記錄的頻道。',
			})
			.addSubcommand(subcommand =>
				subcommand
					.setName('set')
					.setDescription('The channel to send logs in.')
					.setDescriptionLocalizations({
						'en-US': 'The channel to send logs in.',
						'ja': 'ログを送信するチャンネル。',
						'zh-CN': '发送日志的频道。',
						'zh-TW': '傳送記錄的頻道。',
					})
					.addChannelOption(option =>
						option
							.setName('channel')
							.setDescription('The channel to send logs in.')
							.setDescriptionLocalizations({
								'en-US': 'The channel to send logs in.',
								'ja': 'ログを送信するチャンネル。',
								'zh-CN': '发送日志的频道。',
								'zh-TW': '傳送記錄的頻道。',
							})
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildText)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('disable')
					.setDescription('Disable sending logs in this server.')
					.setDescriptionLocalizations({
						'en-US': 'Disable sending logs in this server.',
						'ja': 'このサーバーのログ送信を無効にする。',
						'zh-CN': '停止在该服务器发送日志。',
						'zh-TW': '停止在此伺服器傳送記錄。',
					})
			)
	)
	.addSubcommandGroup(group =>
		group
			.setName('welcome')
			.setDescription('Set the channel to send welcome messages in.')
			.setDescriptionLocalizations({
				'en-US': 'Set the channel to send welcome messages in.',
				'ja': 'ウェルカムメッセージを送信するチャンネルを設定します。',
				'zh-CN': '设置发送欢迎信息的频道。',
				'zh-TW': '設定傳送歡迎訊息的頻道。',
			})
			.addSubcommand(subcommand =>
				subcommand
					.setName('set')
					.setDescription('Set the channel to send welcome messages in.')
					.setDescriptionLocalizations({
						'en-US': 'Set the channel to send welcome messages in.',
						'ja': 'ウェルカムメッセージを送信するチャンネルを設定します。',
						'zh-CN': '设置发送欢迎信息的频道。',
						'zh-TW': '設定傳送歡迎訊息的頻道。',
					})
					.addChannelOption(option =>
						option
							.setName('channel')
							.setDescription('The channel to send welcome messages in.')
							.setDescriptionLocalizations({
								'en-US': 'The channel to send welcome messages in.',
								'ja': 'ウェルカムメッセージを送るチャンネル。',
								'zh-CN': '发送欢迎信息的通道。',
								'zh-TW': '傳送歡迎訊息的頻道。',
							})
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildText)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('disable')
					.setDescription('Disable sending welcome messages in this server.')
					.setDescriptionLocalizations({
						'en-US': 'Disable sending welcome messages in this server.',
						'ja': 'このサーバでウェルカムメッセージの送信を無効にする。',
						'zh-CN': '停止在此服务器中发送欢迎信息。',
						'zh-TW': '停止在此伺服器傳送歡迎訊息。',
					})
			)
	)
	.addSubcommandGroup(group =>
		group
			.setName('bye')
			.setDescription('Set the channel to send bye messages in.')
			.setDescriptionLocalizations({
				'en-US': 'Set the channel to send bye messages in.',
				'ja': 'バイバイメッセージを送信するチャンネルを設定する。',
				'zh-CN': '设置发送再见信息的频道。',
				'zh-TW': '設定傳送再見訊息的頻道。',
			})
			.addSubcommand(subcommand =>
				subcommand
					.setName('set')
					.setDescription('Set the channel to send bye messages in.')
					.setDescriptionLocalizations({
						'en-US': 'Set the channel to send bye messages in.',
						'ja': 'バイバイメッセージを送信するチャンネルを設定する。',
						'zh-CN': '设置发送再见信息的频道。',
						'zh-TW': '設定傳送再見訊息的頻道。',
					})
					.addChannelOption(option =>
						option
							.setName('channel')
							.setDescription('The channel to send bye messages in.')
							.setDescriptionLocalizations({
								'en-US': 'The channel to send bye messages in.',
								'ja': '別れのメッセージを送るチャンネル。 ',
								'zh-CN': '发送再见信息的频道。',
								'zh-TW': '傳送再見訊息的頻道。',
							})
							.setRequired(true)
							.addChannelTypes(ChannelType.GuildText)
					)
			)
			.addSubcommand(subcommand =>
				subcommand
					.setName('disable')
					.setDescription('Disable sending bye messages in this server.')
					.setDescriptionLocalizations({
						'en-US': 'Disable sending bye messages in this server.',
						'ja': 'このサーバでバイバイメッセージを送信しないようにする。',
						'zh-CN': '停止在此服务器上发送再见信息。',
						'zh-TW': '停止在此伺服器傳送再見訊息。',
					})
			)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const rawType = interaction.options.getSubcommandGroup();
	if (rawType !== 'log' && rawType !== 'welcome' && rawType !== 'bye') {
		throw new Error(`CRITICAL: Impossible State. Unknown subcommand group received: ${rawType}`);
	}
	const type: ConfigType = rawType;

	const unknownError = i18next.t('global.unknownError');
	const sendMessagePermissionError = i18next.t('global.sendMessagePermissionError');
	const viewChannelPermissionError = i18next.t('global.viewChannelPermissionError');
	const featureAlreadyDisabledError = type === 'log' ? i18next.t('setChannel.loggingAlreadyDisabledError') : type === 'welcome' ? i18next.t('setChannel.welcomeMessageAlreadyDisabledError') : i18next.t('setChannel.byeMessageAlreadyDisabledError');
	const featureChannelUnchangedError = type === 'log' ? i18next.t('setChannel.loggingChannelUnchangedError') : type === 'welcome' ? i18next.t('setChannel.welcomeMessageChannelUnchangedError') : i18next.t('setChannel.byeMessageChannelUnchangeError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply();

	const channel = interaction.options.getChannel('channel');
	const [guild] = await Guild.findOrCreate({
		where: {
			id: interaction.guild.id,
		},
	});
	const channelKey = channelKeyMap[type];
	const previousChannel = guild[channelKey];

	await setPublicInteractionLanguage(interaction);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const executedByFooter = i18next.t('global.executedByFooter');
	const disabledLiteral = i18next.t('global.disabledLiteral');
	const channelChangedMessage = type === 'log' ? i18next.t('setChannel.logChannelChangedMessage') : i18next.t('setChannel.byeMessageChannelChangedMessage');
	const previousChannelLiteral = i18next.t(`setChannel.previousChannelLiteral`);
	const newChannelLiteral = i18next.t(`setChannel.newChannelLiteral`);
	const currentChannelLiteral = i18next.t(`setChannel.currentChannelLiteral`);

	if (channel && !interaction.guild.members.me.permissionsIn(channel.id).has(PermissionFlagsBits.SendMessages)) {
		await interaction.editReply({
			content: sendMessagePermissionError,
		});
		return;
	}

	if (channel && !interaction.guild.members.me.permissionsIn(channel.id).has(PermissionFlagsBits.ViewChannel)) {
		await interaction.reply({
			content: viewChannelPermissionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!channel && !previousChannel) {
		await interaction.editReply({
			content: featureAlreadyDisabledError,
			components: [createSupportButton()],
		});
		return;
	}

	if (channel && channel.id === previousChannel) {
		await interaction.editReply({
			content: featureChannelUnchangedError,
			components: [createSupportButton()],
		});
		return;
	}

	const actionEmbed = new EmbedBuilder()
		.setColor('#2E4053')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(channelChangedMessage)
		.setThumbnail(interaction.guild.iconURL())
		.addFields([
			{
				name: previousChannelLiteral,
				value: previousChannel ? `<#${previousChannel}>` : disabledLiteral,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
				inline: true,
			},
			{
				name: previousChannel ? newChannelLiteral : currentChannelLiteral,
				value: channel ? `<#${channel.id}>` : disabledLiteral,
				inline: true,
			},
		])
		.setFooter({
			text: executedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await guild.update({
		[channelKey]: channel ? channel.id : null,
	});

	await interaction.editReply({
		embeds: [actionEmbed],
		components: [createSupportButton()],
	});

	await sendLog(interaction.guild, {
		embeds: [actionEmbed],
	});
}
