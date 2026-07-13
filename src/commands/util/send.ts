import { SlashCommandBuilder } from '@discordjs/builders';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import { translateWithDeepL } from '@utils/translateWithDeepL.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { ChannelType, MessageFlags } from 'discord.js';
import Fuse from 'fuse.js';
import i18next from 'i18next';

const languageCodes = [
	'ar',
	'bg',
	'cs',
	'da',
	'de',
	'el',
	'en-GB',
	'en-US',
	'es',
	'et',
	'fi',
	'fr',
	'hu',
	'id',
	'it',
	'ja',
	'ko',
	'lt',
	'lv',
	'nb',
	'nl',
	'pl',
	'pt-BR',
	'pt-PT',
	'ro',
	'ru',
	'sk',
	'sl',
	'sv',
	'tr',
	'uk',
	'zh-HANS',
	'zh-HANT',
] as const;
const languageCodeMap: Record<string, string> = {};

export const data = new SlashCommandBuilder()
	.setName('send')
	.setDescription('Send a translated message.')
	.setDescriptionLocalizations({
		'en-US': 'Send a translated message.',
		'ja': '翻訳したメッセージを送信します。',
		'zh-CN': '发送翻译后的信息。',
		'zh-TW': '傳送翻譯後的訊息。',
	})
	.addStringOption(option =>
		option
			.setName('message')
			.setDescription('The message to translate.')
			.setDescriptionLocalizations({
				'en-US': 'The message to translate.',
				'ja': '翻訳するメッセージ。',
				'zh-CN': '要翻译的信息。',
				'zh-TW': '要翻譯的訊息。',
			})
			.setRequired(true)
	)
	.addStringOption(option =>
		option
			.setName('language')
			.setDescription('The language to translate to.')
			.setDescriptionLocalizations({
				'en-US': 'The language to translate to.',
				'ja': '翻訳する言語。',
				'zh-CN': '要翻译成的语言。',
				'zh-TW': '要翻譯成的語言。',
			})
			.setAutocomplete(true)
			.setRequired(true)
	)
	.setContexts(0);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await interaction.deferReply({
		flags: MessageFlags.Ephemeral,
	});

	await setPrivateInteractionLanguage(interaction);

	languageCodes.forEach(code => {
		languageCodeMap[code] = i18next.t(`${code}`, {
			ns: 'languages',
		});
	});

	const unknownError = i18next.t('global.unknownError');
	const invalidMessageError = i18next.t('translate.invalidMessageError');
	const invalidLanguageError = i18next.t('translate.invalidLanguageError');
	const sendSuccessMessage = i18next.t('send.sendSuccessMessage');

	const message = interaction.options.getString('message', true);
	if (message.trim() === '') {
		await interaction.editReply({
			content: invalidMessageError,
		});
		return;
	}

	const languageName = interaction.options.getString('language', true);
	const targetLanguage = Object.keys(languageCodeMap).find(key => languageCodeMap[key] === languageName);
	if (!targetLanguage) {
		await interaction.editReply({
			content: invalidLanguageError,
		});
		return;
	}

	const translationResult = await translateWithDeepL(message, targetLanguage);

	const channel = interaction.channel;
	if (!channel) {
		await interaction.editReply({
			content: sendSuccessMessage,
		});

		await interaction.followUp({
			content: `<@${interaction.user.id}> > ${translationResult.text}`,
		});
		return;
	}

	if (channel.type !== ChannelType.GuildText) {
		await interaction.editReply({
			content: unknownError,
		});
		return;
	}

	try {
		const webhook = await channel.createWebhook({
			name: 'TranslationByNanaz',
			avatar: interaction.client.user.avatarURL(),
		});

		await webhook.send({
			content: translationResult.text,
			username: `${interaction.user.displayName} (${interaction.user.username})`,
			avatarURL: interaction.user.displayAvatarURL(),
		});

		await webhook.delete();
	} catch {
		await interaction.editReply({
			content: sendSuccessMessage,
		});

		await interaction.followUp({
			content: `<@${interaction.user.id}> > ${translationResult.text}`,
		});
		return;
	}

	await interaction.editReply({
		content: sendSuccessMessage,
	});
}
export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
	i18next.setDefaultNamespace('languages');

	await setPrivateInteractionLanguage(interaction);

	languageCodes.forEach(code => {
		languageCodeMap[code] = i18next.t(`${code}`);
	});

	const focusedValue = interaction.options.getFocused();
	const choices = Object.values(languageCodeMap);

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
		filtered.map(choice => ({
			name: choice,
			value: choice,
		}))
			.slice(0, 25),
	);
}
