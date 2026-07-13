import { generateWithAI } from '@utils/generateWithAI.js';
import type { Client, Message } from 'discord.js';
import { ChannelType, Events, PermissionFlagsBits } from 'discord.js';

export const name = Events.MessageCreate;
export async function execute(message: Message, client: Client): Promise<void> {
	if (!client.user) {
		console.error('Client user not found.');
		process.exit(1);
	}

	if (message.author.bot || (message.channel.type === ChannelType.GuildText && message.guild && message.guild.members.me && message.channel && (!message.guild.members.me.permissionsIn(message.channel).has(PermissionFlagsBits.SendMessages) || !message.guild.members.me.permissionsIn(message.channel).has(PermissionFlagsBits.ViewChannel)))) {
		return;
	}

	if (message.content === 'owo') {
		message.reply('owo!');
		return;
	}

	if (message.mentions.has(client.user, { ignoreEveryone: true, ignoreRoles: true }) || message.channel.type === ChannelType.DM) {
		try {
			const reply = await generateWithAI(message.content, message.author.id === process.env.OWNER_ID);

			// If the reply is too long, split it into multiple messages.
			if (reply.length > 2000) {
				const replyArray = reply.match(/[\s\S]{1,2000}/g);
				replyArray?.forEach(async (msg) => {
					await message.reply(msg);
				});
				return;
			}

			await message.reply(reply);
		} catch (error) {
			console.error(error);
			return;
		}
	}
}
