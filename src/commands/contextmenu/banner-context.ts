import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ContextMenuCommandType, UserContextMenuCommandInteraction } from 'discord.js';
import { ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new ContextMenuCommandBuilder()
	.setName('User Banner')
	.setNameLocalizations({
		'en-US': 'User Banner',
		'ja': 'ユーザーバナー',
		'zh-CN': '用户横幅',
		'zh-TW': '使用者橫幅',
	})
	.setType(ApplicationCommandType.User as ContextMenuCommandType);
export async function execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const user = interaction.targetUser;
	const userFetched = await user.fetch();

	const userNoBannerError = i18next.t('banner.userNoBannerError');
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
		flags: MessageFlags.Ephemeral,
	});
}
