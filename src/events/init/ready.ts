import { BannedMember } from '@models/bannedMember.js';
import { Guild } from '@models/guild.js';
import { Reminder } from '@models/reminder.js';
import { User } from '@models/user.js';
import { sendLog } from '@utils/sendLog.js';
import type { Client } from 'discord.js';
import { EmbedBuilder, Events } from 'discord.js';
import i18next from 'i18next';
import schedule from 'node-schedule';

export const name = Events.ClientReady;
export const once = true;
export async function execute(client: Client): Promise<void> {
	if (!client.user) {
		console.error('Client user not found.');
		process.exit(1);
	}

	console.log(`Ready! Logged in as ${client.user.tag}`);

	const guilds = client.guilds.cache;

	for (const [id, guild] of guilds) {
		try {
			const guildData = await Guild.findOne({
				where: {
					id: guild.id,
				},
			});

			if (!guildData) {
				await Guild.create({
					id: guild.id,
					name: guild.name,
					welcomeMessage: 'Thank you for joining <[serverName]>!',
					byeMessage: 'Goodbye <[username]>, we will miss you!',
					language: 'en-US',
				});
			}
			if (guildData && guildData.name !== guild.name) {
				guildData.update({
					name: guild.name,
				});
			}

			const members = await guild.members.fetch();

			for (const [memberId, member] of members) {
				if (member.user.bot) {
					continue;
				}

				await User.findOrCreate({
					where: {
						id: memberId,
					},
				});
			}
		} catch (error) {
			console.error(`Failed to sync guild ${guild.name} (${id}):`, error);
		}
	}

	const bannedMembers = await BannedMember.findAll({
		where: {
			isBanned: true,
		},
	});

	// Refresh banned users status, then unban them if the ban expired or reschedule the unban.
	for (const bannedMember of bannedMembers) {
		if (!bannedMember.bannedUntil) {
			continue;
		}

		const guild = await client.guilds.fetch(bannedMember.guildId);
		const userFetched = await client.users.fetch(bannedMember.id);
		const guildData = await Guild.findOne({
			where: {
				id: guild.id,
			},
		});
		const clientUser = await guild.members.fetch(client.user.id);

		i18next.changeLanguage(guildData?.language);
		const unbanEmbedTitle = i18next.t('unban.unbanEmbedTitle');
		const unbanEmbedFooter = i18next.t('unban.unbanEmbedFooter');
		const userLiteral = i18next.t('global.userLiteral');
		const usernameLiteral = i18next.t('global.usernameLiteral');
		const reasonLiteral = i18next.t('ban.reasonLiteral');
		const banExpiredMessage = i18next.t('ban.banExpiredMessage');

		/**
		 * Unbans a user then sends a log if log channel exist.
		 */
		async function unban() {
			const unbanEmbed = new EmbedBuilder()
				.setColor('#FF0000')
				.setTitle(unbanEmbedTitle)
				.addFields([
					{
						name: userLiteral,
						value: `${userFetched}`,
						inline: true,
					},
					{
						name: usernameLiteral,
						value: `${userFetched.username}`,
						inline: true,
					},
					{
						name: '\u200B',
						value: '\u200B',
					},
					{
						name: reasonLiteral,
						value: banExpiredMessage,
						inline: true,
					},
				])
				.setTimestamp()
				.setFooter({
					text: unbanEmbedFooter,
					iconURL: clientUser.displayAvatarURL(),
				});

			await guild.members.unban(userFetched);
			await sendLog(guild, {
				embeds: [unbanEmbed],
			});
		}

		if (bannedMember.bannedUntil.getTime() < Date.now()) {
			await unban();
			await bannedMember.update({
				isBanned: false,
				bannedUntil: null,
			});
			continue;
		}

		schedule.scheduleJob(bannedMember.bannedUntil, async () => {
			if (bannedMember.isBanned === false) {
				return;
			}

			await unban();
			await bannedMember.update({
				isBanned: false,
				bannedUntil: null,
			});
		});
	}

	// Delete all reminders that have expired, and reschedule any that have not.
	const reminders = await Reminder.findAll();

	for (const reminder of reminders) {
		if (Date.now() >= reminder.when.getTime()) {
			await reminder.destroy();
			continue;
		}
		const reminderUser = await client.users.fetch(reminder.userId);
		const date = new Date(reminder.when);
		if (reminder.once) {
			if (reminder.dm) {
				schedule.scheduleJob(reminder.id, date, async () => {
					await reminder.destroy();

					await reminderUser.send({
						content: `${reminderUser}\n${reminder.content}`,
					});
				});
				continue;
			}
			if (!reminder.channelId) {
				continue;
			}
			const reminderChannel = await client.channels.fetch(reminder.channelId);
			schedule.scheduleJob(reminder.id, date, async () => {
				await reminder.destroy();

				if (!reminderChannel?.isSendable()) {
					return;
				}

				await reminderChannel.send({
					content: `${reminderUser}\n${reminder.content}`,
				});
			});
			continue;
		}
		const seconds = date.getSeconds();
		const minutes = date.getMinutes();
		const hours = date.getHours();
		const cronTime = `${seconds} ${minutes} ${hours} * * *`;

		if (reminder.dm) {
			const job = schedule.scheduleJob(reminder.id, cronTime, async () => {
				await reminderUser.send({
					content: `${reminderUser}\n${reminder.content}`,
				});

				if (Date.now() >= date.getTime()) {
					await reminder.destroy();
					job.cancel();
				}
			});
			continue;
		}
		if (!reminder.channelId) {
			continue;
		}
		const reminderChannel = await client.channels.fetch(reminder.channelId);
		if (reminderChannel?.isSendable()) {
			await reminder.destroy();
			return;
		}

		const job = schedule.scheduleJob(reminder.id, cronTime, async () => {
			if (!reminderChannel?.isSendable()) {
				await reminder.destroy();
				job.cancel();
				return;
			}

			await reminderChannel.send({
				content: `${reminderUser}\n${reminder.content}`,
			});

			if (Date.now() >= date.getTime()) {
				await reminder.destroy();
				job.cancel();
			}
		});
	}
}
