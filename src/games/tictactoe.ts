import { User } from '@models/user.js';
import { createAcceptAndDeclineButton, createRematchButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ButtonInteraction, CacheType, ChannelSelectMenuInteraction, ChatInputCommandInteraction, User as DiscordUser, InteractionCollector, MentionableSelectMenuInteraction, MessageComponentInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

const EMPTY = '\u200b' as const;
const PLAYER_X = '❌' as const;
const PLAYER_O = '⭕' as const;
type Cell = typeof EMPTY | typeof PLAYER_X | typeof PLAYER_O;

const winningCombos = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[2, 4, 6],
];

/**
 * Play a game of tic-tac-toe with another human user.
 */
export async function tictactoe(interaction: ChatInputCommandInteraction, opponent: DiscordUser): Promise<void> {
	i18next.setDefaultNamespace('games');

	await setInteractionLanguage(interaction);

	const tttTitle = i18next.t('ticTacToe.tttTitle');
	const hostedByFooter = i18next.t('global.hostedByFooter');

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

	let turn = Math.random() < 0.5 ? PLAYER_X : PLAYER_O;
	let currentPlayer = Math.random() < 0.5 ? interaction.user : opponent;
	const leftPlayer = Math.random() < 0.5 ? interaction.user : opponent;
	const rightPlayer = leftPlayer === interaction.user ? opponent : interaction.user;
	const leftPlayerSymbol = turn;
	const rightPlayerSymbol = turn === PLAYER_X ? PLAYER_O : PLAYER_X;
	let gameEnded = false;
	let resettingCollector = false;

	let currentTurnMessage = i18next.t('ticTacToe.currentTurnMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
		currentPlayer: currentPlayer.id,
	});
	const gameEndDrawMessage = i18next.t('ticTacToe.gameEndDrawMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
	});
	const gameEndInactivityMessage = i18next.t('ticTacToe.gameEndInactivityMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
	});

	const board: Cell[] = Array(9).fill(EMPTY);
	/**
	 * Generates the board components based on the current state of the game.
	 */
	const createBoard = (includeRematchButton = false) => {
		const components = [];
		for (let i = 0; i < 3; i++) {
			const row = new ActionRowBuilder<ButtonBuilder>();
			for (let j = 0; j < 3; j++) {
				const index = i * 3 + j;
				const cell = board[index];
				if (!cell) {
					throw new Error(`CRITICAL: Impossible State. Board indexing out of bounds at ${index}`);
				}

				row.addComponents(
					new ButtonBuilder()
						.setCustomId(index.toString())
						.setLabel(cell)
						.setStyle(cell === EMPTY ? ButtonStyle.Secondary : cell === PLAYER_X ? ButtonStyle.Primary : ButtonStyle.Success)
						.setDisabled(cell !== EMPTY || gameEnded),
				);
			}
			components.push(row);
		}
		if (includeRematchButton) {
			components.push(createRematchButton());
		}
		return components;
	};

	const checkWin = (symbol: string) => {
		return winningCombos.some(combo => combo.every(index => board[index] === symbol));
	};

	const gameMessage = await interaction.editReply({
		content: currentTurnMessage,
		embeds: [],
		components: createBoard(),
	});

	let moveCollector: InteractionCollector<StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>>;

	async function startCollector(): Promise<void> {
		moveCollector = gameMessage.createMessageComponentCollector({
			filter: (buttonInteraction: MessageComponentInteraction) => (
				buttonInteraction.user === currentPlayer
			),
			time: 30000,
		});

		moveCollector.on('collect', async (buttonInteraction: MessageComponentInteraction) => {
			await buttonInteraction.deferUpdate();

			const index = parseInt(buttonInteraction.customId, 10);
			if (!board.includes(EMPTY) || gameEnded) {
				return;
			}

			board[index] = turn;

			const isWin = checkWin(turn);
			const isDraw = !isWin && !board.includes(EMPTY);

			if (isWin) {
				gameEnded = true;
				moveCollector.stop();

				const gameEndWinMessage = i18next.t('ticTacToe.gameEndWinMessage', {
					ns: 'games',
					leftPlayer: leftPlayer.id,
					rightPlayer: rightPlayer.id,
					leftPlayerSymbol: leftPlayerSymbol,
					rightPlayerSymbol: rightPlayerSymbol,
					winner: currentPlayer.id,
				});

				await gameMessage.edit({
					content: gameEndWinMessage,
					components: createBoard(true),
				});

				if (currentPlayer.id === interaction.user.id) {
					userData.update({
						tttWins: userData.tttWins + 1,
					});
					opponentData.update({
						tttLosses: opponentData.tttLosses + 1,
					});
				}
				if (currentPlayer.id !== interaction.user.id) {
					userData.update({
						tttLosses: userData.tttLosses + 1,
					});
					opponentData.update({
						tttWins: opponentData.tttWins + 1,
					});
				}
			}

			if (isDraw) {
				gameEnded = true;

				await gameMessage.edit({
					content: gameEndDrawMessage,
					components: createBoard(true),
				});

				userData.update({
					tttDraws: userData.tttDraws + 1,
				});
				opponentData.update({
					tttDraws: opponentData.tttDraws + 1,
				});
			}

			if (gameEnded) {
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
						await tictactoe(interaction, interaction.user);
						return;
					}

					const rematchEmbed = new EmbedBuilder()
						.setColor('#00FF00')
						.setTitle(tttTitle)
						.setFooter({
							text: hostedByFooter,
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setTimestamp();

					const gameEndResultContent = gameMessage.content;
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
						content: `${rematchAccepter}`,
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
							await tictactoe(interaction, opponent);
							return;
						}

						if (buttonInteraction.customId !== 'accept') {
							await gameMessage.edit({
								content: `${gameEndResultContent}\n\n${rematchRequestDeclinedMessage}`,
								embeds: [],
								components: createBoard(),
							});
						}
					});

					acceptCollector.on('end', async () => {
						if (gameMessage && !resettingCollector) {
							await gameMessage.edit({
								content: `${gameEndResultContent}\n\n${rematchRequestIgnoredMessage}`,
								embeds: [],
								components: createBoard(),
							});
						}
					});
				});

				rematchCollector.on('end', async () => {
					if (gameMessage && !resettingCollector) {
						await gameMessage.edit({
							components: createBoard(),
						});
					}
				});

				return;
			}

			turn = turn === PLAYER_X ? PLAYER_O : PLAYER_X;
			currentPlayer = currentPlayer === interaction.user ? opponent : interaction.user;

			currentTurnMessage = i18next.t('ticTacToe.currentTurnMessage', {
				ns: 'games',
				leftPlayer: leftPlayer.id,
				rightPlayer: rightPlayer.id,
				leftPlayerSymbol: leftPlayerSymbol,
				rightPlayerSymbol: rightPlayerSymbol,
				currentPlayer: currentPlayer.id,
			});

			await gameMessage.edit({
				content: currentTurnMessage,
				components: createBoard(),
			});

			resettingCollector = true;
			moveCollector.stop();
			resettingCollector = false;
			await startCollector();
		});

		moveCollector.on('end', async () => {
			if (gameMessage && !gameEnded && !resettingCollector) {
				gameEnded = true;
				await gameMessage.edit({
					content: gameEndInactivityMessage,
					components: createBoard(),
				});
			}
		});
	}

	startCollector();
}

/**
 * Play a game of tic-tac-toe against the bot.
 */
export async function tictactoeBot(interaction: ChatInputCommandInteraction): Promise<void> {
	i18next.setDefaultNamespace('games');

	await setInteractionLanguage(interaction);

	const [userData] = await User.findOrCreate({
		where: {
			id: interaction.user.id,
		},
	});

	let currentPlayer = Math.random() < 0.5 ? interaction.user : interaction.client.user;
	const leftPlayer = currentPlayer;
	const rightPlayer = currentPlayer === interaction.user ? interaction.client.user : interaction.user;
	const leftPlayerSymbol = Math.random() < 0.5 ? PLAYER_X : PLAYER_O;
	const rightPlayerSymbol = leftPlayerSymbol === PLAYER_X ? PLAYER_O : PLAYER_X;
	const botSymbol = currentPlayer === interaction.user ? rightPlayerSymbol : leftPlayerSymbol;
	const playerSymbol = botSymbol === leftPlayerSymbol ? rightPlayerSymbol : leftPlayerSymbol;
	let gameEnded = false;
	let resettingCollector = false;

	let currentTurnMessage = i18next.t('ticTacToe.currentTurnMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
		currentPlayer: currentPlayer.id,
	});
	const gameEndDrawMessage = i18next.t('ticTacToe.gameEndDrawMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
	});
	const gameEndInactivityMessage = i18next.t('ticTacToe.gameEndInactivityMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
	});
	const gameEndBotWinMessage = i18next.t('ticTacToe.gameEndBotWinMessage', {
		leftPlayer: leftPlayer.id,
		rightPlayer: rightPlayer.id,
		leftPlayerSymbol: leftPlayerSymbol,
		rightPlayerSymbol: rightPlayerSymbol,
	});

	const board: Cell[] = new Array(9).fill(EMPTY);
	/**
	 * Generates the board components based on the current state of the game.
	 */
	const createBoard = (includeRematchButton = false) => {
		const components = [];
		for (let i = 0; i < 3; i++) {
			const row = new ActionRowBuilder<ButtonBuilder>();
			for (let j = 0; j < 3; j++) {
				const index = i * 3 + j;
				const cell = board[index];
				if (!cell) {
					throw new Error(`CRITICAL: Impossible State. Board indexing out of bounds at ${index}`);
				}

				row.addComponents(
					new ButtonBuilder()
						.setCustomId(index.toString())
						.setLabel(cell)
						.setStyle(cell === EMPTY ? ButtonStyle.Secondary : cell === PLAYER_X ? ButtonStyle.Primary : ButtonStyle.Success)
						.setDisabled(cell !== EMPTY || gameEnded),
				);
			}
			components.push(row);
		}
		if (includeRematchButton) {
			components.push(createRematchButton());
		}
		return components;
	};

	const gameMessage = await interaction.editReply({
		content: currentTurnMessage,
		components: createBoard(),
	});

	let moveCollector: InteractionCollector<StringSelectMenuInteraction<CacheType> | UserSelectMenuInteraction<CacheType> | RoleSelectMenuInteraction<CacheType> | MentionableSelectMenuInteraction<CacheType> | ChannelSelectMenuInteraction<CacheType> | ButtonInteraction<CacheType>>;

	const checkWin = (symbol: string) => {
		return winningCombos.some(combo => combo.every(index => board[index] === symbol));
	};

	/**
	 * Gets the best move for the bot.
	 * @returns The index number of the chosen spot.
	 */
	const botMove = () => {
		/**
		 * @param newBoard What the board looks like currently.
		 * @returns Returns the best possible score for the given move.
		 */
		const minimax = (newBoard: Cell[], isMaximizing: boolean): number => {
			if (checkWin(botSymbol)) {
				return 1;
			}
			if (checkWin(playerSymbol)) {
				return -1;
			}
			if (!newBoard.includes(EMPTY)) {
				return 0;
			}

			const availableSpots = newBoard.flatMap((spot, index) => spot === EMPTY ? [index] : []);

			if (isMaximizing) {
				let bestScore = -Infinity;
				for (const spot of availableSpots) {
					newBoard[spot] = botSymbol;
					const score = minimax(newBoard, false);
					newBoard[spot] = EMPTY;
					bestScore = Math.max(score, bestScore);
					if (bestScore === 1) {
						break;
					}
				}
				return bestScore;
			}

			let bestScore = Infinity;
			for (const spot of availableSpots) {
				newBoard[spot] = playerSymbol;
				const score = minimax(newBoard, true);
				newBoard[spot] = EMPTY;
				bestScore = Math.min(score, bestScore);
				if (bestScore === -1) {
					break;
				}
			}
			return bestScore;
		};

		let bestScore = -Infinity;
		let bestMove = -1;
		const availableSpots = board.flatMap((spot, index) => spot === EMPTY ? [index] : []);

		for (const spot of availableSpots) {
			board[spot] = botSymbol;
			const score = minimax(board, false);
			board[spot] = EMPTY;
			if (score > bestScore) {
				bestScore = score;
				bestMove = spot;
			}
		}
		return bestMove;
	};

	async function switchTurn(): Promise<void> {
		currentPlayer = currentPlayer === interaction.user ? interaction.client.user : interaction.user;

		currentTurnMessage = i18next.t('ticTacToe.currentTurnMessage', {
			ns: 'games',
			leftPlayer: leftPlayer.id,
			rightPlayer: rightPlayer.id,
			leftPlayerSymbol: leftPlayerSymbol,
			rightPlayerSymbol: rightPlayerSymbol,
			currentPlayer: currentPlayer.id,
		});

		await gameMessage.edit({
			content: currentTurnMessage,
			components: createBoard(),
		});
	}

	async function startCollector(): Promise<void> {
		moveCollector = gameMessage.createMessageComponentCollector({
			filter: (buttonInteraction: MessageComponentInteraction) => (
				buttonInteraction.user === interaction.user
			),
			time: 30000,
		});

		moveCollector.on('collect', async (buttonInteraction: ButtonInteraction) => {
			await buttonInteraction.deferUpdate();
			resettingCollector = true;
			moveCollector.stop();
			resettingCollector = false;

			const index = parseInt(buttonInteraction.customId, 10);
			board[index] = playerSymbol;

			if (!board.includes(EMPTY)) {
				gameEnded = true;

				await gameMessage.edit({
					content: gameEndDrawMessage,
					components: createBoard(true),
				});

				userData.update({
					tttDraws: userData.tttDraws + 1,
				});
			}

			if (gameEnded) {
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

					await tictactoeBot(interaction);
				});

				rematchCollector.on('end', async () => {
					if (gameMessage) {
						await gameMessage.edit({
							components: createBoard(),
						});
					}
				});
				return;
			}

			await switchTurn();
			await startBotMove();
		});

		moveCollector.on('end', async () => {
			if (gameMessage && !gameEnded && !resettingCollector) {
				gameEnded = true;
				await gameMessage.edit({
					content: gameEndInactivityMessage,
					components: createBoard(),
				});
			}
		});
	}

	async function startBotMove() {
		const nextMove = botMove();

		board[nextMove] = botSymbol;

		const isWin = checkWin(botSymbol);
		const isDraw = !isWin && !board.includes(EMPTY);

		if (isWin) {
			gameEnded = true;

			await gameMessage.edit({
				content: gameEndBotWinMessage,
				components: createBoard(true),
			});

			userData.update({
				tttLosses: userData.tttLosses + 1,
			});
		}

		if (isDraw) {
			gameEnded = true;

			await gameMessage.edit({
				content: gameEndDrawMessage,
				components: createBoard(true),
			});

			userData.update({
				tttDraws: userData.tttDraws + 1,
			});
		}

		if (gameEnded) {
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

				await tictactoeBot(interaction);
				return;
			});

			rematchCollector.on('end', async () => {
				if (gameMessage) {
					await gameMessage.edit({
						components: createBoard(),
					});
				}
			});
			return;
		}

		setTimeout(async () => {
			await switchTurn();
			await startCollector();
		}, 1500);
	}

	if (currentPlayer === interaction.client.user) {
		const edges = [1, 3, 5, 7] as const;
		const corners = [0, 2, 6, 8] as const;
		const firstMove = Math.random();

		// The bot has a set chance to choose a spot for the first move. 3.75% for each edge, 15% for each corner, and 25% for the center.
		if (firstMove < 0.15) {
			const edge = edges[Math.floor(Math.random() * edges.length)];
			if (edge === undefined) {
				throw new Error('CRITICAL: Impossible State. Edge is undefined.');
			}
			board[edge] = botSymbol;
		}
		if (firstMove >= 0.15 && firstMove < 0.75) {
			const corner = corners[Math.floor(Math.random() * corners.length)];
			if (corner === undefined) {
				throw new Error('CRITICAL: Impossible State. Corner is undefined.');
			}
			board[corner] = botSymbol;
		}
		if (firstMove >= 0.75) {
			board[4] = botSymbol;
		}

		setTimeout(async () => {
			await switchTurn();
			await startCollector();
		}, 1000);
		return;
	}

	await startCollector();
}
