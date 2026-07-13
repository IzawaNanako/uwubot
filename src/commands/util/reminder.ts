import { SlashCommandBuilder } from '@discordjs/builders';
import { Reminder } from '@models/reminder.js';
import { User } from '@models/user.js';
import { createSupportButton } from '@utils/buttons.js';
import { setInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import i18next from 'i18next';
import schedule from 'node-schedule';
import { v7 as uuidv7 } from 'uuid';

export const data = new SlashCommandBuilder()
	.setName('reminder')
	.setDescription('Manage your reminders.')
	.setDescriptionLocalizations({
		'en-US': 'Manage your reminders.',
		'ja': 'あなたのリマインドを管理する。',
		'zh-CN': '管理您的提醒。',
		'zh-TW': '管理您的提醒。',
	})
	.addSubcommand(subcommand =>
		subcommand
			.setName('create')
			.setDescription('Create a new reminder.')
			.setDescriptionLocalizations({
				'en-US': 'Create a new reminder.',
				'ja': '新しいリマインドを作成する。',
				'zh-CN': '创建一个新的提醒。',
				'zh-TW': '創建一個新的提醒。',
			})
			.addStringOption(option =>
				option
					.setName('content')
					.setDescription('The reminder you want to set. You should set "dm" to true if the reminder is private to you.')
					.setDescriptionLocalizations({
						'en-US': 'The reminder you want to set. You should set "dm" to true if the reminder is private to you.',
						'ja': 'リマインドを設定します。リマインドがあなたにしか見えない場合は"dm"をtrueにしてください。',
						'zh-CN': '设置提醒。如果提醒只对您可见,请将“dm”设置为true。',
						'zh-TW': '設定提醒。如果提醒只對您可見,請將“dm”設為true。',
					})
					.setRequired(true)
			)
			.addStringOption(option =>
				option
					.setName('when')
					.setDescription('The time the bot should remind you or remind you until. /help reminder-format to see the formats.')
					.setDescriptionLocalizations({
						'en-US': 'The time the bot should remind you or remind you until. /help reminder-format to see the formats.',
						'ja': 'ボットがリマインドする時間、またはリマインドし続ける時間。フォーマットは/help reminder-formatで確認できます。',
						'zh-CN': '机器人应该提醒您的时间或提醒您直到。/help reminder-format查看格式。',
						'zh-TW': '機器人應該提醒您的時間或提醒您直到。/help reminder-format查看格式。',
					})
					.setRequired(true)
			)
			.addBooleanOption(option =>
				option
					.setName('once')
					.setDescription('Whether the reminder should be sent only once or repeatedly at the given time until you stop it.')
					.setDescriptionLocalizations({
						'en-US': 'Whether the reminder should be sent only once or repeatedly at the given time until you stop it.',
						'ja': 'リマインドを一度だけ送信するか、指定した時間に繰り返し送信するか。繰り返しの場合は停止するまで送信されます。',
						'zh-CN': '提醒是只发送一次还是在给定的时间重复发送直到您停止它。',
						'zh-TW': '提醒是只發送一次還是在給定的時間重複發送直到您停止它。',
					})
					.setRequired(true)
			)
			.addBooleanOption(option =>
				option
					.setName('dm')
					.setDescription('Whether the reminder should be sent in DMs (true) or in the channel you used the command in (false).')
					.setDescriptionLocalizations({
						'en-US': 'Whether the reminder should be sent in DMs (true) or in the channel you used the command in (false).',
						'ja': 'リマインドをDMで送信するか( true )、コマンドを使用したチャンネルで送信するか( false )。',
						'zh-CN': '提醒是发送到DM(true)还是您使用命令的频道(false)。',
						'zh-TW': '提醒是傳送到DM(true)還是您使用命令的頻道(false)。',
					})
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('List all your active reminders.')
			.setDescriptionLocalizations({
				'en-US': 'List all your active reminders.',
				'ja': 'あなたのすべてのアクティブなリマインドをリストします。',
				'zh-CN': '列出您所有的活动提醒。',
				'zh-TW': '列出您所有的活動提醒。',
			})
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('stop')
			.setDescription('Stop selected reminder.')
			.setDescriptionLocalizations({
				'en-US': 'Stop selected reminders.',
				'ja': '選択したリマインドを停止します。',
				'zh-CN': '停止选定的提醒。',
				'zh-TW': '停止選定的提醒。',
			})
			.addStringOption(option =>
				option
					.setName('id')
					.setDescription('ID of the reminder to stop. Use /reminder list to see IDs, or type "all" to stop every reminder.')
					.setDescriptionLocalizations({
						'en-US': 'ID of the reminder to stop. Use /reminder list to see IDs, or type "all" to stop every reminder.',
						'ja': '停止したいリマインドのID。/reminder listコマンドからIDを取得できます。"all"と入力すると、すべてのリマインドを停止します。',
						'zh-CN': '您要停止的提醒的ID。您可以从/reminder list命令中获取ID。输入“all”以停止所有提醒。',
						'zh-TW': '您要停止的提醒的ID。您可以從/reminder list命令中獲取ID。輸入“all”以停止所有提醒。',
					})
					.setRequired(true)
			)
	);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setInteractionLanguage(interaction);

	const invalidOptionError = i18next.t('global.invalidOptionError');
	const subcommand = interaction.options.getSubcommand();

	if (subcommand === 'create') {
		const unknownError = i18next.t('global.unknownError');
		const reminderLimitError = i18next.t('reminder.reminderLimitError');
		const invalidTimeError = i18next.t('reminder.invalidTimeError');
		const reminderTooLongError = i18next.t('reminder.reminderTooLongError');
		const reminderNoChannelError = i18next.t('reminder.reminderNoChannelError');
		const reminderInDMSuccessMessage = i18next.t('reminder.reminderInDMSuccessMessage');
		const reminderInGuildSuccessMessage = i18next.t('reminder.reminderInGuildSuccessMessage');

		const reminders = await Reminder.findAll({
			where: {
				userId: interaction.user.id,
			},
		});
		if (reminders.length >= 8) {
			await interaction.reply({
				content: reminderLimitError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const content = interaction.options.getString('content', true);
		let when = interaction.options.getString('when', true);
		const once = interaction.options.getBoolean('once', true);
		const dm = interaction.options.getBoolean('dm', true);

		const [user] = await User.findOrCreate({
			where: {
				id: interaction.user.id,
			},
		});

		let month: number | undefined;
		let day: number | undefined;
		let year: number | undefined;
		let hour: number | undefined;
		let minute: number | undefined;
		let second: number = 0;
		let utcOffsetHours: number = 0;
		let utcOffsetMinutes: number = 0;

		const timezoneMatch = when.match(/\(UTC([+-]\d{2}):(\d{2})\)$/);
		if (timezoneMatch) {
			const [, hStr, mStr] = timezoneMatch;
			if (!hStr || !mStr) {
				throw new Error('CRITICAL: Impossible State. Missing regex capture groups for UTC offset.');
			}

			utcOffsetHours = parseInt(hStr, 10);
			utcOffsetMinutes = parseInt(mStr, 10);
			if (utcOffsetHours < 0) {
				utcOffsetMinutes = -utcOffsetMinutes;
			}
			when = when.replace(/\(UTC[+-]\d{2}:\d{2}\)$/, '').trim();
		}

		if (!timezoneMatch) {
			const tzMatch = user.timezone.match(/UTC([+-])(\d{1,2}):(\d{2})/);
			if (tzMatch) {
				const [, sign, hStr, mStr] = tzMatch;
				if (!sign || !hStr || !mStr) {
					throw new Error('CRITICAL: Impossible State. Missing regex capture groups for user timezone.');
				}

				utcOffsetHours = parseInt(hStr, 10) * (sign === '+' ? 1 : -1);
				utcOffsetMinutes = parseInt(mStr, 10) * (sign === '+' ? 1 : -1);
			}
		}

		const timezoneOffsetMinutes = utcOffsetHours * 60 + utcOffsetMinutes;
		const nowInSelectedTimezone = new Date(Date.now() + timezoneOffsetMinutes * 60 * 1000);
		const parts = when.trim().split(/\s+/);

		if (parts.length === 2) {
			const [datePart, timePart] = parts;
			if (!datePart || !timePart) {
				throw new Error('CRITICAL: Impossible State. Date or time part missing from split.');
			}

			const [mStr, dStr, yStr] = datePart.split('/');
			if (!mStr || !dStr) {
				throw new Error('CRITICAL: Impossible State. Month or day missing from date split.');
			}

			month = parseInt(mStr, 10);
			day = parseInt(dStr, 10);
			year = yStr ? parseInt(yStr, 10) : undefined;

			const [hrStr, minStr, secStr] = timePart.split(':');
			if (!hrStr || !minStr) {
				throw new Error('CRITICAL: Impossible State. Hour or minute missing from time split.');
			}

			hour = parseInt(hrStr, 10);
			minute = parseInt(minStr, 10);
			second = secStr ? parseInt(secStr, 10) : 0;
		}

		if (parts.length !== 2) {
			const [timePart] = parts;
			if (!timePart) {
				throw new Error('CRITICAL: Impossible State. Time part missing from split.');
			}

			const [hrStr, minStr, secStr] = timePart.split(':');
			if (!hrStr || !minStr) {
				throw new Error('CRITICAL: Impossible State. Hour or minute missing from time split.');
			}

			hour = parseInt(hrStr, 10);
			minute = parseInt(minStr, 10);
			second = secStr ? parseInt(secStr, 10) : 0;

			year = nowInSelectedTimezone.getUTCFullYear();
			month = nowInSelectedTimezone.getUTCMonth() + 1;
			day = nowInSelectedTimezone.getUTCDate();

			const nowSecondsInSelectedTimezone = nowInSelectedTimezone.getUTCHours() * 3600 + nowInSelectedTimezone.getUTCMinutes() * 60 + nowInSelectedTimezone.getUTCSeconds();
			const inputSecondsInSelectedTimezone = hour * 3600 + minute * 60 + second;

			if (inputSecondsInSelectedTimezone <= nowSecondsInSelectedTimezone) {
				const tomorrowInSelectedTimezone = new Date(Date.UTC(year, month - 1, day + 1));
				year = tomorrowInSelectedTimezone.getUTCFullYear();
				month = tomorrowInSelectedTimezone.getUTCMonth() + 1;
				day = tomorrowInSelectedTimezone.getUTCDate();
			}
		}

		if (hour === undefined || minute === undefined || month === undefined || day === undefined) {
			await interaction.reply({
				content: invalidTimeError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (year === undefined) {
			year = nowInSelectedTimezone.getUTCFullYear();
		}

		const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

		date.setUTCHours(date.getUTCHours() - utcOffsetHours);
		date.setUTCMinutes(date.getUTCMinutes() - utcOffsetMinutes);

		if (Number.isNaN(date.getTime()) || Date.now() >= date.getTime()) {
			await interaction.reply({
				content: invalidTimeError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (content.length > 100) {
			await interaction.reply({
				content: reminderTooLongError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!interaction.channel && !dm) {
			await interaction.reply({
				content: reminderNoChannelError,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const remindData = await Reminder.create({
			id: uuidv7(),
			content: content,
			userId: interaction.user.id,
			when: date,
			once: once,
			dm: dm,
			channelId: dm ? null : (interaction.channel?.id ?? null),
		});

		if (once && dm) {
			schedule.scheduleJob(remindData.id, date, async () => {
				await remindData.destroy();
				await interaction.user.send({
					content: `<@${interaction.user.id}>\n${content}`,
				});
			});

			await interaction.reply({
				content: reminderInDMSuccessMessage,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (once && !dm) {
			schedule.scheduleJob(remindData.id, date, async () => {
				await remindData.destroy();

				if (!interaction.channel?.isSendable()) {
					return;
				}

				await interaction.channel.send({
					content: `<@${interaction.user.id}>\n${content}`,
				});
			});

			await interaction.reply({
				content: reminderInGuildSuccessMessage,
			});
			return;
		}

		const seconds = date.getSeconds();
		const minutes = date.getMinutes();
		const hours = date.getHours();
		const cronTime = `${seconds} ${minutes} ${hours} * * *`;

		if (!once && dm) {
			const job = schedule.scheduleJob(remindData.id, cronTime, async () => {
				await interaction.user.send({
					content: `<@${interaction.user.id}>\n${content}`,
				});

				if (Date.now() >= date.getTime()) {
					await remindData.destroy();
					job.cancel();
				}
			});

			await interaction.reply({
				content: reminderInDMSuccessMessage,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (!once && !dm) {
			if (!interaction.channel?.isSendable()) {
				await interaction.reply({
					content: unknownError,
					flags: MessageFlags.Ephemeral,
				});
				await remindData.destroy();
				return;
			}

			const job = schedule.scheduleJob(remindData.id, cronTime, async () => {
				if (!interaction.channel?.isSendable()) {
					await remindData.destroy();
					job.cancel();
					return;
				}

				await interaction.channel.send({
					content: `<@${interaction.user.id}>\n${content}`,
				});

				if (Date.now() >= date.getTime()) {
					await remindData.destroy();
					job.cancel();
				}
			});

			await interaction.reply({
				content: reminderInGuildSuccessMessage,
			});
			return;
		}
	}

	if (subcommand === 'list') {
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const noActiveRemindersError = i18next.t('reminder.noActiveRemindersError');
		const fetchedByFooter = i18next.t('global.fetchedByFooter');
		const reminderContentLiteral = i18next.t('reminder.reminderContentLiteral');
		const reminderTypeLiteral = i18next.t('reminder.reminderTypeLiteral');
		const reminderEmbedTitle = i18next.t('reminder.reminderEmbedTitle');
		const reminderEmbedDescription = i18next.t('reminder.reminderEmbedDescription');
		const reminderTypeOnce = i18next.t('reminder.reminderTypeOnce');
		const reminderTypeRepeating = i18next.t('reminder.reminderTypeRepeating');

		const reminders = await Reminder.findAll({
			where: {
				userId: interaction.user.id,
			},
		});

		if (reminders.length === 0) {
			await interaction.editReply({
				content: noActiveRemindersError,
			});
			return;
		}

		const remindersEmbed = new EmbedBuilder()
			.setColor('#FFFF00')
			.setTitle(reminderEmbedTitle)
			.setDescription(reminderEmbedDescription)
			.addFields(
				{
					name: 'ID',
					value: reminderContentLiteral,
					inline: true,
				},
				{
					name: 'Time',
					value: reminderTypeLiteral,
					inline: true,
				},
				{
					name: '\u200B',
					value: '\u200B',
				},
			)
			.setFooter({
				text: fetchedByFooter,
				iconURL: interaction.client.user.displayAvatarURL(),
			})
			.setTimestamp();

		for (const reminder of reminders) {
			remindersEmbed
				.addFields(
					{
						name: `\`\`\`${reminder.id}\`\`\``,
						value: `${reminder.content}`,
						inline: true,
					},
					{
						name: `<t:${Math.floor(reminder.when.getTime() / 1000)}:F>`,
						value: reminder.once ? reminderTypeOnce : reminderTypeRepeating,
						inline: true,
					},
					{
						name: '\u200B',
						value: '\u200B',
					},
				);
		}

		await interaction.editReply({
			embeds: [remindersEmbed],
			components: [createSupportButton()],
		});
		return;
	}

	if (subcommand === 'stop') {
		await interaction.deferReply({
			flags: MessageFlags.Ephemeral,
		});

		const noActiveRemindersError = i18next.t('reminder.noActiveRemindersError');
		const reminderNotExistError = i18next.t('reminder.reminderNotExistError');
		const stopRemindSuccessMessage = i18next.t('reminder.stopRemindSuccessMessage');

		const id = interaction.options.getString('id', true);

		if (id === 'all') {
			const reminders = await Reminder.findAll({
				where: {
					userId: interaction.user.id,
				},
			});

			if (reminders.length === 0) {
				await interaction.editReply({
					content: noActiveRemindersError,
				});
				return;
			}

			for (const reminder of reminders) {
				const scheduledJob = schedule.scheduledJobs[reminder.id];
				if (scheduledJob) {
					scheduledJob.cancel();
				}
				await reminder.destroy();
			}

			await interaction.editReply({
				content: stopRemindSuccessMessage,
				components: [createSupportButton()],
			});
			return;
		}

		const reminder = await Reminder.findOne({
			where: {
				id,
				userId: interaction.user.id,
			},
		});

		if (!reminder) {
			await interaction.editReply({
				content: reminderNotExistError,
			});
			return;
		}

		const scheduledJob = schedule.scheduledJobs[reminder.id];
		if (scheduledJob) {
			scheduledJob.cancel();
		}
		await reminder.destroy();

		await interaction.editReply({
			content: stopRemindSuccessMessage,
			components: [createSupportButton()],
		});
		return;
	}

	await interaction.reply({
		content: invalidOptionError,
		flags: MessageFlags.Ephemeral,
	});
}
