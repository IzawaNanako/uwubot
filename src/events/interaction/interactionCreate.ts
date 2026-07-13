import { CommandPermission } from '@models/commandPermission.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { AutocompleteInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction } from 'discord.js';
import { Events, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const name = Events.InteractionCreate;
export async function execute(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction | AutocompleteInteraction): Promise<void> {
	i18next.setDefaultNamespace('events');

	await setInteractionLanguage(interaction);

	const commandUnknownError = i18next.t('interactionCreate.commandUnknownError');
	const commandDisabled = i18next.t('interactionCreate.commandDisabled');

	if (!interaction.isChatInputCommand() && !interaction.isAutocomplete() && !interaction.isContextMenuCommand()) {
		return;
	}
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found, but it was triggered somehow.`);
		return;
	}

	if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
		try {
			if (interaction.guildId) {
				const perm = await CommandPermission.findOne({
					where: {
						guildId: interaction.guildId,
						commandName: interaction.commandName,
					},
				});

				if (perm && !perm.isEnabled) {
					await interaction.reply({
						content: commandDisabled,
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
			}

			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: commandUnknownError,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			await interaction.reply({
				content: commandUnknownError,
				flags: MessageFlags.Ephemeral,
			});
		}
		return;
	}
	if (interaction.isAutocomplete()) {
		if (command.autocomplete) {
			try {
				await command.autocomplete(interaction);
			} catch (error) {
				console.error(error);
			}
			return;
		}

		console.error(`The command "${interaction.commandName}" does not have an autocomplete method, but it was triggered somehow.`);
	}
}
