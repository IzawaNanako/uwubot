import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ContextMenuCommandType, User, UserContextMenuCommandInteraction } from 'discord.js';
import { ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new ContextMenuCommandBuilder()
	.setName('User Avatar')
	.setNameLocalizations({
		'en-US': 'User Avatar',
		'ja': 'ユーザーアバター',
		'zh-CN': '用户头像',
		'zh-TW': '使用者頭像',
	})
	.setType(ApplicationCommandType.User as ContextMenuCommandType);
export async function execute(interaction: UserContextMenuCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const user = interaction.targetUser;

	const displayedByFooter = i18next.t('global.displayedByFooter');
	const avatarEmbedTitle = i18next.t('avatar.avatarEmbedTitle', {
		userDisplayName: user.displayName,
	});
	const avatarURLDescription = i18next.t('avatar.avatarUrlDescription', {
		avatarUrl: user.avatarURL(),
	});
	const displayAvatarURLDescription = i18next.t('avatar.displayAvatarUrlDescription', {
		displayAvatarurl: user.displayAvatarURL(),
	});

	const avatarEmbed = new EmbedBuilder()
		.setColor('#5865F2')
		.setTitle(avatarEmbedTitle)
		.setFooter({
			text: displayedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	function setAvatarEmbed(user: User): void {
		if (user.bot) {
			avatarEmbed
				.setDescription(avatarURLDescription)
				.setImage(user.avatarURL({
					size: 2048,
				}));

			return;
		}

		avatarEmbed
			.setDescription(displayAvatarURLDescription)
			.setImage(user.displayAvatarURL({
				size: 2048,
			}));
	}

	setAvatarEmbed(user);

	await interaction.reply({
		embeds: [avatarEmbed],
		components: [createSupportButton()],
		flags: MessageFlags.Ephemeral,
	});
}
