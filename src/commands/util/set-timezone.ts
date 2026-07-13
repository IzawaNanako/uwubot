import { SlashCommandBuilder } from '@discordjs/builders';
import { User } from '@models/user.js';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('set-timezone')
	.setDescription('Set your timezone. Example: "UTC+09:00" or "UTC-05:00".')
	.setDescriptionLocalizations({
		'en-US': 'Set your timezone. Example: "UTC+09:00" or "UTC-05:00".',
		'ja': 'タイムゾーンを設定します。例："UTC+09:00" または "UTC-05:00"。',
		'zh-CN': '设置你的时区。示例："UTC+09:00" 或 "UTC-05:00"。',
		'zh-TW': '設定你的時區。範例："UTC+09:00" 或 "UTC-05:00"。',
	})
	.addStringOption(option =>
		option
			.setName('timezone')
			.setDescription('Your timezone. Example: "UTC+09:00" or "UTC-05:00".')
			.setDescriptionLocalizations({
				'en-US': 'Your timezone. Example: "UTC+09:00" or "UTC-05:00".',
				'ja': 'あなたのタイムゾーン。例："UTC+09:00" または "UTC-05:00"。',
				'zh-CN': '你的时区。示例："UTC+09:00" 或 "UTC-05:00"。',
				'zh-TW': '你的時區。範例："UTC+09:00" 或 "UTC-05:00"。',
			})
			.setRequired(true)
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	const [user] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	await setPrivateInteractionLanguage(interaction);

	const invalidTimezoneError = i18next.t('setTimezone.invalidTimezoneError');
	const timezoneAlreadySetError = i18next.t('setTimezone.timezoneAlreadySetError');
	const timezoneSetSuccess = i18next.t('setTimezone.timezoneSetSuccess', {
		timezone: interaction.options.getString('timezone', true),
	});
	const timezone = interaction.options.getString('timezone', true).toUpperCase();
	const timezoneRegex = /^UTC([+-])(\d{2}):(\d{2})$/;
	const match = timezone.match(timezoneRegex);
	if (!match) {
		await interaction.reply({
			content: invalidTimezoneError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const [, sign, hours, minutes] = match;
	if (!sign || !hours || !minutes) {
		throw new Error(`CRITICAL: Impossible State. Timezone Regex matched but capture groups are missing for ${timezone}`);
	}
	const totalMinutes = (parseInt(hours, 10) * 60 + parseInt(minutes, 10)) * (sign === '-' ? -1 : 1);
	if (totalMinutes < -720 || totalMinutes > 840) {
		await interaction.reply({
			content: invalidTimezoneError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (user.timezone === timezone) {
		await interaction.reply({
			content: timezoneAlreadySetError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await user.update({
		timezone: timezone,
	});
	await interaction.reply({
		content: timezoneSetSuccess,
		flags: MessageFlags.Ephemeral,
	});
}
