import { SlashCommandBuilder } from '@discordjs/builders';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('servericon')
	.setDescription('Display the icon of the selected server.')
	.setDescriptionLocalizations({
		'en-US': 'Display the icon of the selected server.',
		'ja': '選択したサーバーのアイコンを表示する。',
		'zh-CN': '显示所选服务器的图标。',
		'zh-TW': '顯示所選伺服器的圖示。',
	})
	.addStringOption(option =>
		option
			.setName('server-id')
			.setDescription('The ID of the server to display the icon of. "/help ids" for how to get IDs.')
			.setDescriptionLocalizations({
				'en-US': 'The ID of the server to display the icon of. "/help ids" for how to get IDs.',
				'ja': 'アイコンを表示するサーバーのID。 IDの取得方法は"/help ids"を参照。',
				'zh-CN': '要显示图标的服务器的ID。关于如何获取ID，请参见"/help ids"。',
				'zh-TW': '要顯示圖示的伺服器ID。"/help ids"可瞭解如何取得ID。',
			})
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const displayedByFooter = i18next.t('global.displayedByFooter');
	const invalidServerIdError = i18next.t('serverIcon.invalidServerIdError');
	const invalidServerIconError = i18next.t('serverIcon.invalidServerIconError');

	let serverID = interaction.options.getString('server');

	if (!serverID && interaction.guild) {
		serverID = interaction.guild.id;
	}

	if (!serverID) {
		await interaction.reply({
			content: invalidServerIdError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const server = await interaction.client.guilds.fetch(serverID);
	const serverIcon = server.iconURL({
		size: 2048,
	});

	const serverIconEmbedTitle = i18next.t('serverIcon.serverIconEmbedTitle', {
		serverName: server.name,
	});
	const serverIconEmbedDescription = i18next.t('serverIcon.serverIconEmbedDescription', {
		serverIconUrl: serverIcon,
	});

	if (!serverIcon) {
		await interaction.reply({
			content: invalidServerIconError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const serverIconEmbed = new EmbedBuilder()
		.setColor('#5865F2')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(serverIconEmbedTitle)
		.setDescription(serverIconEmbedDescription)
		.setImage(serverIcon)
		.setFooter({
			text: displayedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	await interaction.reply({
		embeds: [serverIconEmbed],
		components: [createSupportButton()],
	});
}
