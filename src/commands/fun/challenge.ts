import { SlashCommandBuilder } from '@discordjs/builders';
import { createAcceptAndDeclineButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';
import { ChannelType, DiscordAPIError, EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import i18next from 'i18next';
import { rockpaperscissors, rockpaperscissorsBot } from '@/games/rockpaperscissors.js';
import { tictactoe, tictactoeBot } from '@/games/tictactoe.js';

export const data = new SlashCommandBuilder()
	.setName('challenge')
	.setDescription('Challenge someone to a game!')
	.setDescriptionLocalizations({
		'en-US': 'Challenge someone to a game!',
		'ja': '誰かに勝負を挑む！',
		'zh-CN': '挑战某人来一场比赛！',
		'zh-TW': '挑戰某人來一場比賽！',
	})
	.addStringOption(option =>
		option
			.setName('game')
			.setDescription('The game you want to play.')
			.setDescriptionLocalizations({
				'en-US': 'The game you want to play.',
				'ja': 'あなたがプレーしたい試合。',
				'zh-CN': '您想玩的游戏。',
				'zh-TW': '您想玩的遊戲。',
			})
			.addChoices(
				{
					name: 'tic-tac-toe',
					value: 'ttt',
				},
				{
					name: 'rock-paper-scissors',
					value: 'rps',
				},
			)
			.setRequired(true)
	)
	.addUserOption(option =>
		option
			.setName('user')
			.setDescription('The user you want to challenge. You can also challenge me!')
			.setDescriptionLocalizations({
				'en-US': 'The user you want to challenge. You can also challenge me!',
				'ja': '挑戦したいユーザー。私に挑戦することもできます！',
				'zh-CN': '您要挑战的用户。 您也可以挑战我！',
				'zh-TW': '您要挑戰的使用者。 您也可以挑戰我！',
			})
			.setRequired(true)
	)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const gameMap: { [key: string]: string } = {
		'ttt': i18next.t('challenge.tttName'),
		'rps': i18next.t('challenge.rpsName'),
	};
	const notTextChannelError = i18next.t('challenge.notTextChannelError');
	const invalidGameError = i18next.t('challenge.invalidGameError');
	const invalidUserError = i18next.t('global.invalidUserError');
	const challengeOtherBotError = i18next.t('challenge.challengeOtherBotError');

	try {
		if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
			await interaction.reply({
				content: notTextChannelError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const game = interaction.options.get('game', true).value as string;
		if (!game) {
			await interaction.reply({
				content: invalidGameError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const opponent = interaction.options.get('user', true).user;
		if (!opponent) {
			await interaction.reply({
				content: invalidUserError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		if (opponent.bot && opponent !== interaction.client.user) {
			await interaction.reply({
				content: challengeOtherBotError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const challengeLetterLiteral = i18next.t('challenge.challengeLetterLiteral');
		const challengeLetterMessage = i18next.t('challenge.challengeLetterMessage', {
			challenger: interaction.user.id,
			game: gameMap[game],
		});
		const deliveredByFooter = i18next.t('challenge.deliveredByFooter');
		const challengeDeclinedMessage = i18next.t('challenge.challengeDeclinedMessage', {
			challenger: interaction.user.id,
			challenged: opponent.id,
		});
		const challengeNotRespondedMessage = i18next.t('challenge.challengeNotRespondedMessage', {
			challenged: opponent.id,
		});
		const challengeThemselvesMessage = i18next.t('challenge.challengeThemselvesMessage');
		const challengeCurrentBotMessage = i18next.t('challenge.challengeCurrentBotMessage');

		if (opponent !== interaction.client.user && opponent !== interaction.user) {
			const letterEmbed = new EmbedBuilder()
				.setColor('#5865F2')
				.setTitle(challengeLetterLiteral)
				.setDescription(challengeLetterMessage)
				.setFooter({
					text: deliveredByFooter,
					iconURL: interaction.client.user.displayAvatarURL(),
				})
				.setTimestamp();
			const challengeLetter = await interaction.reply({
				content: `<@${opponent.id}>`,
				embeds: [letterEmbed],
				components: [createAcceptAndDeclineButton()],
			});
			const acceptCollector = challengeLetter.createMessageComponentCollector({
				filter: i => i.user.id === opponent.id,
				max: 1,
				time: 60000,
			});
			let received = false;

			acceptCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
				received = true;
				acceptCollector.stop();
				if (buttonInteraction.customId === 'decline') {
					letterEmbed
						.setDescription(challengeDeclinedMessage);
					await challengeLetter.edit({
						content: '',
						embeds: [letterEmbed],
						components: [],
					});
					return;
				}

				if (game === 'ttt') {
					await tictactoe(interaction, opponent);
					return;
				}
				if (game === 'rps') {
					await rockpaperscissors(interaction, opponent);
					return;
				}
			});
			acceptCollector.on('end', async () => {
				if (!received) {
					letterEmbed
						.setDescription(challengeNotRespondedMessage);
					await challengeLetter.edit({
						content: '',
						embeds: [letterEmbed],
						components: [],
					});
					return;
				}
			});
		}
		if (opponent === interaction.user) {
			await interaction.reply({
				content: challengeThemselvesMessage,
			});
			setTimeout(async () => {
				if (game === 'ttt') {
					await tictactoe(interaction, opponent);
					return;
				}
				if (game === 'rps') {
					await rockpaperscissors(interaction, opponent);
					return;
				}
			}, 2000);
		}
		if (opponent === interaction.client.user) {
			await interaction.reply({
				content: challengeCurrentBotMessage,
			});
			setTimeout(async () => {
				if (game === 'ttt') {
					await tictactoeBot(interaction);
					return;
				}
				if (game === 'rps') {
					await rockpaperscissorsBot(interaction);
					return;
				}
			}, 2000);
		}
	} catch (error) {
		if (error instanceof DiscordAPIError && error.code === 10008) {
			return;
		}
		console.error(error);
		return;
	}
}
