import { SlashCommandBuilder } from '@discordjs/builders';
import { Guild } from '@models/guild.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import Fuse from 'fuse.js';
import i18next from 'i18next';

const languageMap: Record<string, string> = {
	'English (United States)': 'en-US',
	'日本語': 'ja',
	'简体中文 (中国)': 'zh-CN',
	'繁體中文 (臺灣)': 'zh-TW',
};

export const data = new SlashCommandBuilder()
	.setName('set-server-language')
	.setNameLocalizations({
		'en-US': 'set-server-language',
		'ja': 'セットサーバー言語',
		'zh-CN': '设置服务器语言',
		'zh-TW': '設定伺服器語言',
	})
	.setDescription('Set the bot language for this server.')
	.setDescriptionLocalizations({
		'en-US': 'Set the bot language for this server.',
		'ja': 'このサーバーのボット言語を設定します。',
		'zh-CN': '设置该服务器的机器人语言。',
		'zh-TW': '設定此伺服器的機器人語言。',
	})
	.addStringOption(option =>
		option
			.setName('language')
			.setNameLocalizations({
				'en-US': 'language',
				'ja': '言語',
				'zh-CN': '语言',
				'zh-TW': '語言',
			})
			.setDescription("Languages supported. Note that command names and descriptions are based on users' Discord language.")
			.setDescriptionLocalizations({
				'en-US': "Languages supported. Note that command names and descriptions are based on users' Discord language.",
				'ja': '対応言語。コマンド名と説明はユーザーのDiscord言語に基づいている。',
				'zh-CN': '支持的语言。请注意，命令名称和描述是基于用户的Discord语言。',
				'zh-TW': '支援的語言。請注意，指令名稱和說明是基於使用者的Discord語言。',
			})
			.setRequired(true)
			.setAutocomplete(true)
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const serverLanguageAlreadyUsingError = i18next.t('language.serverLanguageAlreadyUsingError');
	const invalidLanguageError = i18next.t('translate.invalidLanguageError');

	if (!interaction.guild) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const language = interaction.options.getString('language', true);
	if (!languageMap[language]) {
		await interaction.reply({
			content: invalidLanguageError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const [guild] = await Guild.findOrCreate({
		where: {
			id: interaction.guild.id,
		},
	});

	if (languageMap[language] === guild.language) {
		await interaction.reply({
			content: serverLanguageAlreadyUsingError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	i18next.changeLanguage(languageMap[language]);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const serverLanguageChangedMessage = i18next.t('language.serverLanguageChangedMessage');
	const previousLanguageLiteral = i18next.t('language.previousLanguageLiteral');
	const currentLanguageLiteral = i18next.t('language.currentLanguageLiteral');
	const executedByFooter = i18next.t('global.executedByFooter');
	const previousLanguageName = i18next.t(`${guild.language}`, {
		ns: 'languages',
	});
	const currentLanguageName = i18next.t(`${language}`, {
		ns: 'languages',
	});

	const actionEmbed = new EmbedBuilder()
		.setColor('#2E4053')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(serverLanguageChangedMessage)
		.setThumbnail(interaction.guild.iconURL())
		.addFields([
			{
				name: previousLanguageLiteral,
				value: previousLanguageName,
			},
			{
				name: currentLanguageLiteral,
				value: currentLanguageName,
			},
		])
		.setFooter({
			text: executedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await guild.update({
		language: languageMap[language] ?? 'en-US',
	});

	await interaction.reply({
		embeds: [actionEmbed],
		components: [createSupportButton()],
	});

	await sendLog(interaction.guild, {
		embeds: [actionEmbed],
	});
}
export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
	const focusedValue = interaction.options.getFocused();
	const choices = [
		'English (United States)',
		'日本語',
		'简体中文 (中国)',
		'繁體中文 (臺灣)',
	];

	function filterChoices(focusedValue: string): string[] {
		if (focusedValue === '') {
			return choices;
		}

		const fuse = new Fuse(choices, {
			keys: ['value'],
			threshold: 0.3,
		});

		return fuse.search(focusedValue).map(result => result.item);
	}

	const filtered = filterChoices(focusedValue);

	await interaction.respond(
		filtered
			.map(choice => ({
				name: choice,
				value: choice,
			}))
			.slice(0, 25),
	);
}
