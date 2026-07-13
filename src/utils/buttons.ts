import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import i18next from 'i18next';

const supportServer = process.env.SUPPORT_SERVER || '';

if (!supportServer) {
	console.error('Support server not found.');
}

export const createRematchButton = () =>
	new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('rematch')
				.setLabel(i18next.t('buttons.rematchLabel', {
					ns: 'general',
				}))
				.setStyle(ButtonStyle.Danger),
		);

/**
 * Creates a button that links to the support server.
 */
export const createSupportButton = () =>
	new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setLabel(i18next.t('buttons.supportServerLabel', {
					ns: 'general',
				}))
				.setStyle(ButtonStyle.Link)
				.setEmoji('📞')
				.setURL(supportServer),
		);

export const createAcceptAndDeclineButton = () =>
	new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setCustomId('accept')
				.setLabel(i18next.t('buttons.acceptLabel', {
					ns: 'general',
				}))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('decline')
				.setLabel(i18next.t('buttons.declineLabel', {
					ns: 'general',
				}))
				.setStyle(ButtonStyle.Danger),
		);
