import { SlashCommandBuilder } from '@discordjs/builders';
import { Guild } from '@models/guild.js';
import { WelcomeRole } from '@models/welcomeRole.js';
import { createSupportButton } from '@utils/buttons.js';
import { sendLog } from '@utils/sendLog.js';
import { setPrivateInteractionLanguage } from '@utils/setInteractionLanguage.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

export const data = new SlashCommandBuilder()
	.setName('welcome-roles')
	.setDescription('Manage roles to give to new members of this server.')
	.setDescriptionLocalizations({
		'en-US': 'Manage roles to give to new members of this server.',
		'ja': 'このサーバーの新しいメンバーに与えるロ一ルを管理します。',
		'zh-CN': '管理要给予本服务器新成员的身份组。',
		'zh-TW': '管理要給予這個伺服器新成員的身分組。',
	})
	.addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Add a role to give to new members of this server.')
			.setDescriptionLocalizations({
				'en-US': 'Add a role to give to new members of this server.',
				'ja': 'このサーバーの新しいメンバーに贈るロ一ルを追加する。',
				'zh-CN': '添加一个身份组，以给予本服务器的新成员。',
				'zh-TW': '新增一個身份組，以給予這個伺服器的新成員。',
			})
			.addRoleOption(option =>
				option
					.setName('role')
					.setDescription('The role to give to new members of this server.')
					.setDescriptionLocalizations({
						'en-US': 'The role to give to new members of this server.',
						'ja': 'このサーバーの新しいメンバーに与えるロ一ル。',
						'zh-CN': '给予本服务器新成员的身份组。',
						'zh-TW': '給這個伺服器新成員的身分組。',
					})
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('remove')
			.setDescription('Remove a role from being given to new members of this server.')
			.setDescriptionLocalizations({
				'en-US': 'Remove a role from being given to new members of this server.',
				'ja': 'このサーバーの新しいメンバーに与えられるロ一ルを削除する。',
				'zh-CN': '移除一个给予此服务器新成员的身分组。',
				'zh-TW': '移除一個給予此伺服器新成員的身分組。',
			})
			.addRoleOption(option =>
				option
					.setName('role')
					.setDescription('The role to remove from being given to new members of this server.')
					.setDescriptionLocalizations({
						'en-US': 'The role to remove from being given to new members of this server.',
						'ja': 'このサーバーの新メンバーに与えられないようにするロ一ル。',
						'zh-CN': '要移除给予此服务器新成员的身分组。',
						'zh-TW': '要移除給予此伺服器新成員的身分組。',
					})
					.setRequired(true)
			)
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('clear')
			.setDescription('Clear all welcome roles of this server.')
			.setDescriptionLocalizations({
				'en-US': 'Clear all welcome roles of this server.',
				'ja': 'このサーバーのウェルカムロ一ルをすべて消去する。',
				'zh-CN': '清除本服务器的所有欢迎身份组。',
				'zh-TW': '清除此伺服器的所有歡迎身分組。',
			})
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
	.setContexts(InteractionContextType.Guild);
export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
	await setPrivateInteractionLanguage(interaction);

	const unknownError = i18next.t('global.unknownError');
	const manageRolesPermissionError = i18next.t('global.manageRolesPermissionError');

	if (!interaction.guild?.members.me) {
		await interaction.reply({
			content: unknownError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const [guild] = await Guild.findOrCreate({
		where: {
			id: interaction.guild.id,
		},
	});

	i18next.changeLanguage(guild.language);

	const requestedByAuthor = i18next.t('global.requestedByAuthor', {
		userDisplayName: interaction.user.displayName,
	});
	const executedByFooter = i18next.t('global.executedByFooter');
	const noneLiteral = i18next.t('global.noneLiteral');
	const welcomeRolesChangedMessage = i18next.t('welcomeRoles.welcomeRolesChangedMessage');
	const previousRolesLiteral = i18next.t('welcomeRoles.previousRolesLiteral');
	const currentRolesLiteral = i18next.t('welcomeRoles.currentRolesLiteral');
	const roleAlreadyInListError = i18next.t('welcomeRoles.roleAlreadyInListError');

	if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
		await interaction.reply({
			content: manageRolesPermissionError,
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	await interaction.deferReply();
	const action = interaction.options.getSubcommand();
	const role = interaction.options.getRole('role');

	let roles = await WelcomeRole.findAll({
		where: {
			guildId: guild.id,
		},
	});

	const previousRolesList = roles.map(oldRole => `<@&${oldRole.id}>`).join(', ');

	if (previousRolesList.includes(`<@&${role?.id}>`) && action === 'add') {
		await interaction.editReply({
			content: roleAlreadyInListError,
		});
		return;
	}

	const actionEmbed = new EmbedBuilder()
		.setColor('#2E4053')
		.setAuthor({
			name: requestedByAuthor,
		})
		.setTitle(welcomeRolesChangedMessage)
		.setThumbnail(interaction.guild.iconURL())
		.addFields([
			{
				name: previousRolesLiteral,
				value: previousRolesList.length > 0 ? previousRolesList : noneLiteral,
				inline: true,
			},
			{
				name: '\u200B',
				value: '\u200B',
				inline: true,
			},
		])
		.setTimestamp()
		.setFooter({
			text: executedByFooter,
			iconURL: interaction.client.user.displayAvatarURL(),
		});

	const isTargetedAction = action === 'add' || action === 'remove';

	if (isTargetedAction && !role) {
		await interaction.editReply({
			content: unknownError,
		});
		return;
	}
	if (action === 'add' && role) {
		await WelcomeRole.create({
			id: role.id,
			guildId: guild.id,
		});
	}
	if (action === 'remove' && role) {
		await WelcomeRole.destroy({
			where: {
				id: role.id,
				guildId: guild.id,
			},
		});
	}
	if (!isTargetedAction) {
		await WelcomeRole.destroy({
			where: {
				guildId: guild.id,
			},
		});
	}

	roles = await WelcomeRole.findAll({
		where: {
			guildId: guild.id,
		},
	});

	const rolesList = roles.map(role => `<@&${role.id}>`).join(', ');

	actionEmbed
		.addFields([
			{
				name: currentRolesLiteral,
				value: rolesList.length > 0 ? rolesList : noneLiteral,
				inline: true,
			},
		]);

	await interaction.editReply({
		embeds: [actionEmbed],
		components: [createSupportButton()],
	});

	await sendLog(interaction.guild, {
		embeds: [actionEmbed],
	});
}
