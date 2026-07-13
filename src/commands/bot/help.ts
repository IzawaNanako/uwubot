import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import Fuse from 'fuse.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Get help on certain features of this bot.')
	.setDescriptionLocalizations({
		'en-US': 'Get help on certain features of this bot.',
		'ja': 'このボットの特定の機能に関するヘルプを取得します。',
		'zh-CN': '获取有关该机器人某些功能的帮助。',
		'zh-TW': '取得本機器人某些功能的協助。',
	})
	.addStringOption(option =>
		option
			.setName('option')
			.setDescription('The thing you want to get help on, check "/help Menu" if you don\'t seem to find what you need.')
			.setDescriptionLocalizations({
				'en-US': 'The thing you want to get help on, check "/help Menu" if you don\'t seem to find what you need.',
				'ja': '必要なものが見つからなければ、"/help Menu"をチェックしてください。',
				'zh-CN': '您想得到帮助的事情，如果找不到所需的帮助，请查看"/help Menu"。',
				'zh-TW': '您想要獲得幫助的事情，如果找不到所需的幫助，請查看"/help Menu"。',
			})
			.setAutocomplete(true)
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const invalidOptionError = i18next.t('global.invalidOptionError');
	const helpMenuTitle = i18next.t('help.helpMenuTitle');
	const helpMenuDescription = i18next.t('help.helpMenuDescription');
	const helpMenuOptionMenuDescription = i18next.t('help.helpMenuOptionMenuDescription');
	const helpMenuOptionSettingsDescription = i18next.t('help.helpMenuOptionSettingsDescription');
	const helpMenuOptionFormattingDescription = i18next.t('help.helpMenuOptionFormattingDescription');
	const helpMenuOptionIdsDescription = i18next.t('help.helpMenuOptionIdsDescription');
	const helpMenuOptionMsgVariablesDescription = i18next.t('help.helpMenuOptionMsgVariablesDescription');
	const helpMenuOptionReminderFormatDescription = i18next.t('help.helpMenuOptionReminderFormatDescription');
	const settingsHelpsTitle = i18next.t('help.settingsHelpsTitle');
	const formattingHelpsTitle = i18next.t('help.formattingHelpsTitle');
	const idsHelpsTitle = i18next.t('help.idsHelpsTitle');
	const msgVariablesHelpsTitle = i18next.t('help.msgVariablesHelpsTitle');
	const reminderFormatHelpsTitle = i18next.t('help.reminderFormatHelpsTitle');
	const helpEmbedFooter = i18next.t('help.helpEmbedFooter');
	const settingsHelpsContent = i18next.t('help.settingsHelpsContent');
	const formattingHelpsContent = i18next.t('help.formattingHelpsContent');
	const idsHelpsContent = i18next.t('help.idsHelpsContent');
	const msgVariablesHelpsContent = i18next.t('help.msgVariablesHelpsContent');
	const reminderFormatHelpsContent = i18next.t('help.reminderFormatHelpsContent');

	let option = interaction.options.getString('option');

	if (option) {
		option = option.toLowerCase();
	}

	const helpEmbed = new EmbedBuilder()
		.setTimestamp()
		.setFooter({
			text: helpEmbedFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	function checkOption(option: string | null): boolean {
		if (!option || option === 'menu') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(helpMenuTitle)
				.setDescription(helpMenuDescription)
				.addFields(
					{
						name: 'menu',
						value: helpMenuOptionMenuDescription,
						inline: true,
					},
					{
						name: 'settings',
						value: helpMenuOptionSettingsDescription,
						inline: true,
					},
					{
						name: 'formatting',
						value: helpMenuOptionFormattingDescription,
						inline: true,
					},
					{
						name: '\u200B',
						value: '\u200B',
					},
					{
						name: 'ids',
						value: helpMenuOptionIdsDescription,
						inline: true,
					},
					{
						name: 'msg-variables',
						value: helpMenuOptionMsgVariablesDescription,
						inline: true,
					},
					{
						name: 'reminder-format',
						value: helpMenuOptionReminderFormatDescription,
						inline: true,
					},
					{
						name: '\u200B',
						value: '\u200B',
					},
				);

			return true;
		}
		if (option === 'settings') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(settingsHelpsTitle)
				.setDescription(settingsHelpsContent);

			return true;
		}
		if (option === 'formatting') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(formattingHelpsTitle)
				.setDescription(formattingHelpsContent);

			return true;
		}
		if (option === 'ids') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(idsHelpsTitle)
				.setDescription(idsHelpsContent)
				.setImage('https://i.imgur.com/Dn402t2.gif');

			return true;
		}
		if (option === 'msg-variables') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(msgVariablesHelpsTitle)
				.setDescription(msgVariablesHelpsContent);

			return true;
		}
		if (option === 'reminder-format') {
			helpEmbed
				.setColor('#2E4053')
				.setTitle(reminderFormatHelpsTitle)
				.setDescription(reminderFormatHelpsContent);

			return true;
		}

		return false;
	}

	if (!checkOption(option)) {
		await interaction.reply({
			content: invalidOptionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.reply({
		embeds: [helpEmbed],
		components: [createSupportButton()],
		flags: MessageFlags.Ephemeral,
	});
}
export async function autocomplete(interaction: AutocompleteInteraction): Promise<void> {
	const focusedValue = interaction.options.getFocused();
	const choices = [
		'menu',
		'settings',
		'formatting',
		'ids',
		'msg-variables',
		'reminder-format',
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
