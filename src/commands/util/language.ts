import { SlashCommandBuilder } from '@discordjs/builders';
import { User } from '@models/user.js';
import { createSupportButton } from '@utils/buttons.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import Fuse from 'fuse.js';
import i18next from 'i18next';

const languageMap: Record<string, string> = {
	'English (United States)': 'en-US',
	'日本語': 'ja',
	'简体中文 (中国)': 'zh-CN',
	'繁體中文 (臺灣)': 'zh-TW',
};

export const data = new SlashCommandBuilder()
	.setName('language')
	.setNameLocalizations({
		'en-US': 'language',
		'ja': '言語',
		'zh-CN': '语言',
		'zh-TW': '語言',
	})
	.setDescription("Set your preferred bot language. Note that some features prioritize server's language.")
	.setDescriptionLocalizations({
		'en-US': "Set your preferred bot language. Note that some features prioritize server's language.",
		'ja': 'お好みのボット言語を設定してください。機能によっては、サーバーの言語を優先するものもあります。',
		'zh-CN': '设置您喜欢的机器人语言。请注意，某些功能会优先使用服务器语言。',
		'zh-TW': '設定您偏好的機器人語言。請注意，某些功能會優先使用伺服器的語言。',
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
			.setDescription('Languages supported. Note that command names and descriptions are based on your Discord language.')
			.setDescriptionLocalizations({
				'en-US': 'Languages supported. Note that command names and descriptions are based on your Discord language.',
				'ja': '対応言語。コマンド名と説明はDiscordの言語に基づいています。',
				'zh-CN': '设置您喜欢的机器人语言。请注意，某些功能会优先使用服务器语言。',
				'zh-TW': '設定您偏好的機器人語言。請注意，某些功能會優先使用伺服器的語言。',
			})
			.setRequired(true)
			.setAutocomplete(true)
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	const language = interaction.options.getString('language', true);
	const [user] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	await i18next.changeLanguage(languageMap[language]);

	const languageAlreadyUsingError = i18next.t('language.languageAlreadyUsingError');
	const invalidLanguageError = i18next.t('language.invalidLanguageError');
	const userLanguageChangedMessage = i18next.t('language.userLanguageChangedMessage');
	const previousLanguageLiteral = i18next.t('language.previousLanguageLiteral');
	const currentLanguageLiteral = i18next.t('language.currentLanguageLiteral');
	const executedByFooter = i18next.t('global.executedByFooter');
	const previousLanguageName = i18next.t(`${user.language}`, {
		ns: 'languages',
	});
	const currentLanguageName = i18next.t(`${language}`, {
		ns: 'languages',
	});

	if (!languageMap[language]) {
		await interaction.reply({
			content: invalidLanguageError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (user.language === languageMap[language]) {
		await interaction.reply({
			content: languageAlreadyUsingError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const actionEmbed = new EmbedBuilder()
		.setColor('#2E4053')
		.setTitle(userLanguageChangedMessage)
		.setThumbnail(interaction.user.avatarURL())
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

	await user.update({
		language: languageMap[language] ?? 'en-US',
	});

	await interaction.reply({
		embeds: [actionEmbed],
		components: [createSupportButton()],
		flags: MessageFlags.Ephemeral,
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
