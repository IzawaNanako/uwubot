import { User } from '@models/user.js';
import { createAcceptAndDeclineButton, createRematchButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ButtonInteraction, ChatInputCommandInteraction, User as DiscordUser, MessageComponentInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

const CHOICES = [
	'rock',
	'paper',
	'scissors',
] as const;
type Choice = typeof CHOICES[number];

const choiceMap: Record<Choice, string> = {
	'rock': '🪨',
	'paper': '📄',
	'scissors': '✂️',
};

const botEmojiMap: Record<string, string> = {
	'🪨': '📄',
	'📄': '✂️',
	'✂️': '🪨',
};

function isValidChoice(choice: string): choice is Choice {
	return CHOICES.includes(choice as Choice);
}

/**
 * Play a game of rock-paper-scissors with another human user.
 */
export async function rockpaperscissors(interaction: ChatInputCommandInteraction, opponent: DiscordUser): Promise<void> {
	i18next.setDefaultNamespace('games');

	await setInteractionLanguage(interaction);

	const rpsTitle = i18next.t('rockPaperScissors.rpsTitle');
	const hostedByFooter = i18next.t('global.hostedByFooter');
	const rockButtonLabel = i18next.t('rockPaperScissors.rockButtonLabel');
	const paperButtonLabel = i18next.t('rockPaperScissors.paperButtonLabel');
	const scissorsButtonLabel = i18next.t('rockPaperScissors.scissorsButtonLabel');
	const rockVersusRockResult = i18next.t('rockPaperScissors.rockVersusRockResult');
	const paperVersusPaperResult = i18next.t('rockPaperScissors.paperVersusPaperResult');
	const scissorsVersusScissorsResult = i18next.t('rockPaperScissors.scissorsVersusScissorsResult');
	const rockVersusScissorsResult = i18next.t('rockPaperScissors.rockVersusScissorsResult');
	const scissorsVersusPaperResult = i18next.t('rockPaperScissors.scissorsVersusPaperResult');
	const paperVersusRockResult = i18next.t('rockPaperScissors.paperVersusRockResult');

	const [userData] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});
	const [opponentData] = await User.findOrCreate({
		where: {
			id: opponent.id,
		},
	});

	const leftPlayer = Math.random() < 0.5 ? interaction.user : opponent;
	const rightPlayer = leftPlayer === interaction.user ? opponent : interaction.user;

	const makeChoiceMessage = i18next.t('rockPaperScissors.makeChoiceMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
	});
	const gameEndInactivityMessage = i18next.t('rockPaperScissors.gameEndInactivityMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
	});

	const gameEmbed = new EmbedBuilder()
		.setColor('#00ff00')
		.setTitle(rpsTitle)
		.setDescription(makeChoiceMessage)
		.setImage('https://i.imgur.com/8r6dKEH.png')
		.setFooter({
			text: hostedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	const gameMessage = await interaction.editReply({
		content: '',
		embeds: [gameEmbed],
		components: [
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('rock')
						.setLabel(rockButtonLabel)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('paper')
						.setLabel(paperButtonLabel)
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('scissors')
						.setLabel(scissorsButtonLabel)
						.setStyle(ButtonStyle.Danger),
				),
		],
	});

	let userChoice: Choice | null = null;
	let opponentChoice: Choice | null = null;
	let userChosen = false;
	let opponentChosen = false;
	let resettingCollector = false;

	const choiceCollector = gameMessage.createMessageComponentCollector({
		filter: (buttonInteraction: MessageComponentInteraction) => (buttonInteraction.user === interaction.user && !userChosen) || (buttonInteraction.user === opponent && !opponentChosen),
		time: 30000,
	});

	choiceCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
		await buttonInteraction.deferUpdate();

		const customId = buttonInteraction.customId;
		if (!isValidChoice(customId)) {
			throw new Error(`CRITICAL: Impossible State. Unknown RPS button interaction: ${customId}`);
		}

		const isUserTurn = (buttonInteraction.user === interaction.user && opponent !== interaction.user) || (buttonInteraction.user === interaction.user && opponentChosen);

		if (isUserTurn) {
			userChoice = customId;
			userChosen = true;
		}

		if (!isUserTurn && buttonInteraction.user === opponent) {
			opponentChoice = customId;
			opponentChosen = true;
		}

		if (userChosen && opponentChosen && userChoice && opponentChoice) {
			resettingCollector = true;
			choiceCollector.stop();
			resettingCollector = false;

			const userChoiceEmoji = choiceMap[userChoice];
			const opponentChoiceEmoji = choiceMap[opponentChoice];

			const leftPlayerEmoji = leftPlayer === interaction.user ? userChoiceEmoji : opponentChoiceEmoji;
			const rightPlayerEmoji = leftPlayer === interaction.user ? opponentChoiceEmoji : userChoiceEmoji;

			const isDraw = userChoice === opponentChoice;
			const userWins = (userChoice === 'rock' && opponentChoice === 'scissors') || (userChoice === 'scissors' && opponentChoice === 'paper') || (userChoice === 'paper' && opponentChoice === 'rock');
			const opponentWins = !isDraw && !userWins;

			if (isDraw) {
				const gameEndDrawMessage = i18next.t('rockPaperScissors.gameEndDrawMessage', {
					ns: 'games',
					leftPlayer: leftPlayer.id,
					rightPlayer: rightPlayer.id,
					leftPlayerEmoji: leftPlayerEmoji,
					rightPlayerEmoji: rightPlayerEmoji,
				});
				gameEmbed.setDescription(gameEndDrawMessage);

				userData.update({
					rpsDraws: userData.rpsDraws + 1,
				});
				opponentData.update({
					rpsDraws: opponentData.rpsDraws + 1,
				});

				const drawPayloads: Record<Choice, { value: string; image: string }> = {
					'rock': {
						value: rockVersusRockResult,
						image: 'https://i.imgur.com/tGBxsYc.png',
					},
					'paper': {
						value: paperVersusPaperResult,
						image: 'https://i.imgur.com/1yzgQ0K.png',
					},
					'scissors': {
						value: scissorsVersusScissorsResult,
						image: 'https://i.imgur.com/pD7JrnS.png',
					},
				};

				gameEmbed
					.addFields([{
						name: '\u200b',
						value: drawPayloads[userChoice].value,
					}])
					.setImage(drawPayloads[userChoice].image);
			}

			if (!isDraw) {
				const winner = userWins ? interaction.user.id : opponent.id;

				const gameEndWinMessage = i18next.t('rockPaperScissors.gameEndWinMessage', {
					ns: 'games',
					leftPlayer: leftPlayer.id,
					rightPlayer: rightPlayer.id,
					leftPlayerEmoji: leftPlayerEmoji,
					rightPlayerEmoji: rightPlayerEmoji,
					winner: winner,
				});
				gameEmbed.setDescription(gameEndWinMessage);

				const winPayloads: Record<string, { value: string; image: string }> = {
					'rock-scissors': {
						value: rockVersusScissorsResult,
						image: 'https://i.imgur.com/AIF5JpE.png',
					},
					'scissors-rock': {
						value: rockVersusScissorsResult,
						image: 'https://i.imgur.com/AIF5JpE.png',
					},
					'scissors-paper': {
						value: scissorsVersusPaperResult,
						image: 'https://i.imgur.com/CUi7LYq.png',
					},
					'paper-scissors': {
						value: scissorsVersusPaperResult,
						image: 'https://i.imgur.com/CUi7LYq.png',
					},
					'paper-rock': {
						value: paperVersusRockResult,
						image: 'https://i.imgur.com/fPMYgBK.png',
					},
					'rock-paper': {
						value: paperVersusRockResult,
						image: 'https://i.imgur.com/fPMYgBK.png',
					},
				};

				const scenario = `${userChoice}-${opponentChoice}`;
				const payload = winPayloads[scenario];
				if (!payload) {
					throw new Error(`CRITICAL: Impossible State. RPS scenario: ${scenario}`);
				}

				gameEmbed
					.addFields([{
						name: '\u200b',
						value: payload.value,
					}])
					.setImage(payload.image);

				if (userWins) {
					userData.update({
						rpsWins: userData.rpsWins + 1,
					});
					opponentData.update({
						rpsLosses: opponentData.rpsLosses + 1,
					});
				}

				if (opponentWins) {
					userData.update({
						rpsLosses: userData.rpsLosses + 1,
					});
					opponentData.update({
						rpsWins: opponentData.rpsWins + 1,
					});
				}
			}

			await gameMessage.edit({
				embeds: [gameEmbed],
				components: [createRematchButton()],
			});

			const rematchCollector = gameMessage.createMessageComponentCollector({
				filter: (buttonInteraction: MessageComponentInteraction) => (
					buttonInteraction.user === interaction.user || buttonInteraction.user === opponent
				),
				time: 30000,
			});

			rematchCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
				await buttonInteraction.deferUpdate();
				resettingCollector = true;
				rematchCollector.stop();
				resettingCollector = false;

				if (interaction.user === opponent) {
					await rockpaperscissors(interaction, interaction.user);
					return;
				}

				const rematchEmbed = new EmbedBuilder()
					.setColor('#00FF00')
					.setTitle(rpsTitle)
					.setFooter({
						text: hostedByFooter,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setTimestamp();

				const rematchRequester = buttonInteraction.user;
				const rematchAccepter = buttonInteraction.user === interaction.user ? opponent : interaction.user;

				const rematchRequestMessage = i18next.t('global.rematchRequestMessage', {
					ns: 'games',
					rematchRequester: rematchRequester.id,
				});
				const rematchRequestDeclinedMessage = i18next.t('global.rematchRequestDeclinedMessage', {
					ns: 'games',
					rematchRequester: rematchRequester.id,
					rematchAccepter: rematchAccepter.id,
				});
				const rematchRequestIgnoredMessage = i18next.t('global.rematchRequestIgnoredMessage', {
					ns: 'games',
					rematchRequester: rematchRequester.id,
					rematchAccepter: rematchAccepter.id,
				});

				await gameMessage.edit({
					content: `<@${rematchAccepter.id}>`,
					embeds: [
						rematchEmbed
							.setDescription(rematchRequestMessage),
					],
					components: [createAcceptAndDeclineButton()],
				});

				const acceptCollector = gameMessage.createMessageComponentCollector({
					filter: (buttonInteraction: MessageComponentInteraction) => (
						buttonInteraction.user === rematchAccepter
					),
					time: 30000,
				});

				acceptCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
					await buttonInteraction.deferUpdate();
					resettingCollector = true;
					acceptCollector.stop();
					resettingCollector = false;

					if (buttonInteraction.customId === 'accept') {
						await rockpaperscissors(interaction, opponent);
						return;
					}

					if (buttonInteraction.customId !== 'accept') {
						await gameMessage.edit({
							content: rematchRequestDeclinedMessage,
							embeds: [gameEmbed],
						});
					}
				});

				acceptCollector.on('end', async () => {
					if (gameMessage && !resettingCollector) {
						await gameMessage.edit({
							content: rematchRequestIgnoredMessage,
							embeds: [gameEmbed],
						});
					}
				});
			});

			rematchCollector.on('end', async () => {
				if (gameMessage && !resettingCollector) {
					await gameMessage.edit({
						components: [],
					});
				}
			});
		}
	});

	choiceCollector.on('end', async () => {
		if (gameMessage && !resettingCollector) {
			gameEmbed.setDescription(gameEndInactivityMessage);
			await gameMessage.edit({
				embeds: [gameEmbed],
				components: [],
			});
		}
	});
}

/**
 * Play a game of rock-paper-scissors against the bot.
 */
export async function rockpaperscissorsBot(interaction: ChatInputCommandInteraction): Promise<void> {
	i18next.setDefaultNamespace('games');

	await setInteractionLanguage(interaction);

	const rpsTitle = i18next.t('rockPaperScissors.rpsTitle');
	const hostedByFooter = i18next.t('global.hostedByFooter');
	const rockButtonLabel = i18next.t('rockPaperScissors.rockButtonLabel');
	const paperButtonLabel = i18next.t('rockPaperScissors.paperButtonLabel');
	const scissorsButtonLabel = i18next.t('rockPaperScissors.scissorsButtonLabel');
	const rockVersusRockResult = i18next.t('rockPaperScissors.rockVersusRockResult');
	const paperVersusPaperResult = i18next.t('rockPaperScissors.paperVersusPaperResult');
	const scissorsVersusScissorsResult = i18next.t('rockPaperScissors.scissorsVersusScissorsResult');
	const rockVersusScissorsResult = i18next.t('rockPaperScissors.rockVersusScissorsResult');
	const scissorsVersusPaperResult = i18next.t('rockPaperScissors.scissorsVersusPaperResult');
	const paperVersusRockResult = i18next.t('rockPaperScissors.paperVersusRockResult');

	const [userData] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	const leftPlayer = Math.random() < 0.5 ? interaction.user : interaction.client.user;
	const rightPlayer = leftPlayer === interaction.user ? interaction.client.user : interaction.user;

	const makeChoiceMessage = i18next.t('rockPaperScissors.makeChoiceMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
	});
	const gameEndInactivityMessage = i18next.t('rockPaperScissors.gameEndInactivityMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
	});

	const gameEmbed = new EmbedBuilder()
		.setColor('#00ff00')
		.setTitle(rpsTitle)
		.setDescription(makeChoiceMessage)
		.setImage('https://i.imgur.com/8r6dKEH.png')
		.setFooter({
			text: hostedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		})
		.setTimestamp();

	const gameMessage = await interaction.editReply({
		content: '',
		embeds: [gameEmbed],
		components: [
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('rock')
						.setLabel(rockButtonLabel)
						.setStyle(ButtonStyle.Primary),
					new ButtonBuilder()
						.setCustomId('paper')
						.setLabel(paperButtonLabel)
						.setStyle(ButtonStyle.Success),
					new ButtonBuilder()
						.setCustomId('scissors')
						.setLabel(scissorsButtonLabel)
						.setStyle(ButtonStyle.Danger),
				),
		],
	});

	let resettingCollector = false;

	const choiceCollector = gameMessage.createMessageComponentCollector({
		filter: (buttonInteraction: MessageComponentInteraction) => (
			buttonInteraction.user === interaction.user
		),
		time: 30000,
	});

	choiceCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
		await buttonInteraction.deferUpdate();

		const customId = buttonInteraction.customId;
		if (!isValidChoice(customId)) {
			throw new Error(`CRITICAL: Impossible State. Unknown RPS button interaction: ${customId}`);
		}

		resettingCollector = true;
		choiceCollector.stop();
		resettingCollector = false;

		const userChoice = customId;
		const userChoiceEmoji = choiceMap[userChoice];

		const botEmojiPayload = botEmojiMap[userChoiceEmoji];
		if (!botEmojiPayload) {
			throw new Error(`CRITICAL: Impossible State. Bot emoji mapping missing for: ${userChoiceEmoji}`);
		}

		const leftPlayerEmoji = leftPlayer === interaction.user ? userChoiceEmoji : botEmojiPayload;
		const rightPlayerEmoji = leftPlayer === interaction.user ? botEmojiPayload : userChoiceEmoji;

		const gameEndDrawMessage = i18next.t('rockPaperScissors.gameEndDrawMessage', {
			ns: 'games',
			leftPlayer: leftPlayer.id,
			rightPlayer: rightPlayer.id,
			leftPlayerEmoji: leftPlayerEmoji,
			rightPlayerEmoji: rightPlayerEmoji,
		});
		const gameEndWinMessage = i18next.t('rockPaperScissors.gameEndWinMessage', {
			ns: 'games',
			leftPlayer: leftPlayer.id,
			rightPlayer: rightPlayer.id,
			leftPlayerEmoji: leftPlayerEmoji,
			rightPlayerEmoji: rightPlayerEmoji,
			winner: leftPlayer === interaction.client.user ? leftPlayer.id : rightPlayer.id,
		});

		const isDraw = Math.random() < 0.05;

		// User has a 5% chance of drawing, otherwise the bot wins.
		if (isDraw) {
			gameEmbed.setDescription(gameEndDrawMessage);

			const drawPayloads: Record<Choice, { value: string; image: string }> = {
				'rock': {
					value: rockVersusRockResult,
					image: 'https://i.imgur.com/tGBxsYc.png',
				},
				'paper': {
					value: paperVersusPaperResult,
					image: 'https://i.imgur.com/1yzgQ0K.png',
				},
				'scissors': {
					value: scissorsVersusScissorsResult,
					image: 'https://i.imgur.com/pD7JrnS.png',
				},
			};

			gameEmbed
				.addFields([{
					name: '\u200b',
					value: drawPayloads[userChoice].value,
				}])
				.setImage(drawPayloads[userChoice].image);

			userData.update({
				rpsWins: userData.rpsWins + 1,
			});
		}

		if (!isDraw) {
			gameEmbed.setDescription(gameEndWinMessage);

			const winPayloads: Record<Choice, { value: string; image: string }> = {
				'rock': {
					value: paperVersusRockResult,
					image: 'https://i.imgur.com/fPMYgBK.png',
				},
				'paper': {
					value: scissorsVersusPaperResult,
					image: 'https://i.imgur.com/CUi7LYq.png',
				},
				'scissors': {
					value: rockVersusScissorsResult,
					image: 'https://i.imgur.com/AIF5JpE.png',
				},
			};

			gameEmbed
				.addFields([{
					name: '\u200b',
					value: winPayloads[userChoice].value,
				}])
				.setImage(winPayloads[userChoice].image);

			userData.update({
				rpsLosses: userData.rpsLosses + 1,
			});
		}

		await gameMessage.edit({
			embeds: [gameEmbed],
			components: [createRematchButton()],
		});

		const rematchCollector = gameMessage.createMessageComponentCollector({
			filter: (buttonInteraction: MessageComponentInteraction) => (
				buttonInteraction.user === interaction.user
			),
			time: 30000,
		});

		rematchCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
			await buttonInteraction.deferUpdate();
			resettingCollector = true;
			rematchCollector.stop();
			resettingCollector = false;

			await rockpaperscissorsBot(interaction);
			return;
		});

		rematchCollector.on('end', async () => {
			if (gameMessage) {
				await gameMessage.edit({
					components: [],
				});
			}
		});
	});

	choiceCollector.on('end', async () => {
		if (gameMessage && !resettingCollector) {
			gameEmbed.setDescription(gameEndInactivityMessage);
			await gameMessage.edit({
				embeds: [gameEmbed],
				components: [],
			});
		}
	});
}
