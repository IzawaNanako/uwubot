import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { User } from '@models/user.js';
import { translateWithDeepL } from '@utils/translateWithDeepL.js';
import type { ContextMenuCommandType, MessageContextMenuCommandInteraction } from 'discord.js';
import { ApplicationCommandType, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new ContextMenuCommandBuilder()
	.setName('Translate Message')
	.setNameLocalizations({
		'en-US': 'Translate Message',
		'ja': 'メッセージを翻訳する',
		'zh-CN': '翻译信息',
		'zh-TW': '翻譯訊息',
	})
	.setType(ApplicationCommandType.Message as ContextMenuCommandType);
export async function execute(interaction: MessageContextMenuCommandInteraction): Promise<void> {
	const executeUser = await User.findOne({
		where: {
			id: interaction.user.id,
		},
	});
	await i18next.changeLanguage(executeUser ? executeUser.language : interaction.locale);

	const invalidMessageError = i18next.t('translate.invalidMessageError');

	const message = interaction.targetMessage.content;
	if (message.trim() === '') {
		await interaction.reply({
			content: invalidMessageError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const language = executeUser ? executeUser.language : interaction.locale;
	const translationResult = await translateWithDeepL(message, language);

	const languageName = i18next.t(`${language}`, {
		ns: 'languages',
	});
	const translatedToMessage = i18next.t('translate.translatedToMessage', {
		translatedLanguage: languageName,
		translatedMessage: translationResult.text,
	});
	const translatedToFallback = i18next.t('translate.translateLanguageNotFound', {
		fallbackLanguage: translationResult.resolvedLanguage,
		translatedMessage: translationResult.text,
	});

	await interaction.reply({
		content: translationResult.isFallback ? translatedToFallback : translatedToMessage,
		flags: MessageFlags.Ephemeral,
	});
}
