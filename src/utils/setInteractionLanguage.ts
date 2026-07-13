import { Guild } from '@models/guild.js';
import { User } from '@models/user.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import i18next from 'i18next';

/**
 * If all the replies of the interaction is possible to be seen in a guild, change the language of the interaction based on if the interaction is in a guild or not.
 */
export async function setInteractionLanguage(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | AutocompleteInteraction): Promise<void> {
	if (interaction.guild) {
		const [guild] = await Guild.findOrCreate({
			where: {
				id: interaction.guild.id,
			},
		});
		await i18next.changeLanguage(guild.language);
		return;
	}

	const [executeUser] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	await i18next.changeLanguage(executeUser.language);
}

/**
 * The reply of the interaction is guaranteed to not be visible in a guild currently, change the language of the interaction based on either user settings or their locale at all time.
 */
export async function setPrivateInteractionLanguage(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | AutocompleteInteraction): Promise<void> {
	const [executeUser] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	await i18next.changeLanguage(executeUser.language);
}

/**
 * The reply of the interaction is guaranteed to be visible in a guild currently, change the language of the interaction based on the guild settings.
 */
export async function setPublicInteractionLanguage(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | AutocompleteInteraction): Promise<void> {
	const [guild] = await Guild.findOrCreate({
		where: {
			id: interaction.guild?.id,
		},
	});

	await i18next.changeLanguage(guild.language);
}
