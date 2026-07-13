import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Check the current latency of the bot.')
	.setDescriptionLocalizations({
		'en-US': 'Check the current latency of the bot.',
		'ja': 'ボットの現在の待ち時間をチェックする。',
		'zh-CN': '检查机器人当前的延迟时间。',
		'zh-TW': '檢查機器人目前的延遲時間。',
	});
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const pingingMessage = i18next.t('ping.pingingMessage');
	const pingFinishedMessage = i18next.t('ping.pingFinishedMessage');
	const botLatencyLiteral = i18next.t('ping.botLatencyLiteral');
	const pingedByFooter = i18next.t('ping.pingedByFooter');

	const pingEmbed = new EmbedBuilder()
		.setColor('#808080')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(pingingMessage)
		.setFooter({
			text: pingedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	const msg = await interaction.reply({
		embeds: [pingEmbed],
		withResponse: true,
	});

	const ping = Math.floor((msg.resource?.message?.createdTimestamp ?? 0) - interaction.createdTimestamp);

	await interaction.editReply({
		embeds: [
			pingEmbed
				.setColor(ping < 200 ? '#00FF00' : ping < 400 ? '#FFFF00' : '#FF0000')
				.setTitle(pingFinishedMessage)
				.addFields([
					{
						name: botLatencyLiteral,
						value: `${ping}ms`,
						inline: true,
					},
				]),
		],
		components: [createSupportButton()],
	});
}
