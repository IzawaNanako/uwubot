import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('banner')
	.setDescription('Display the banner of the selected user.')
	.setDescriptionLocalizations({
		'en-US': 'Display the banner of the selected user.',
		'ja': '選択したユーザーのバナーを表示する。',
		'zh-CN': '显示所选用户的横幅。',
		'zh-TW': '顯示選取使用者的橫幅。',
	})
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user to display the banner of.')
			.setDescriptionLocalizations({
				'en-US': 'The user to display the banner of.',
				'ja': 'バナーを表示するユーザー。',
				'zh-CN': '要显示横幅的用户。',
				'zh-TW': '要顯示橫幅的使用者。',
			})
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const user = interaction.options.getUser('user') || interaction.user;
	const userFetched = await user.fetch();

	const userNoBannerError = i18next.t('banner.userNoBannerError');
	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const displayedByFooter = i18next.t('global.displayedByFooter');
	const bannerEmbedTitle = i18next.t('banner.bannerEmbedTitle', {
		userDisplayName: userFetched.displayName,
	});
	const bannerURLDescription = i18next.t('banner.bannerUrlDescription', {
		bannerUrl: userFetched.bannerURL(),
	});

	if (!userFetched.bannerURL()) {
		await interaction.reply({
			content: userNoBannerError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const bannerEmbed = new EmbedBuilder()
		.setColor('#5865F2')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(bannerEmbedTitle)
		.setDescription(bannerURLDescription)
		.setImage(
			userFetched.bannerURL({
				size: 2048,
			}) ?? null,
		)
		.setFooter({
			text: displayedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await interaction.reply({
		embeds: [bannerEmbed],
		components: [createSupportButton()],
	});
}
