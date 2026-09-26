import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';

import { errorEmbed } from '../utils/embeds.js';
import { InteractionHelper } from '../utils/interactionHelper.js';
import {
    parseRegistrationDateTime,
    REGISTRATION_DATE_TIME_HELP,
} from '../utils/registerDateTime.js';

const ARMY_LEADER_ROLE_ID = '1543724880879427675';

const REVIEW_ROLE_IDS = [
    '1543710638025605270', // Chief Officer
    '1548015112785498203', // CO-In-Training
    '1543710552868786186', // Head Moderator
];

export default {
    data: new SlashCommandBuilder()
        .setName('register')
        .setDescription('Register a battle or event with CPAF')

        .addStringOption(option =>
            option
                .setName('battle_name')
                .setDescription('Name of the battle or event')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('army')
                .setDescription('Army participating in the battle')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('date_time')
                .setDescription('ISO date/time or Discord timestamp, e.g. <t:1790622000:F>')
                .setRequired(true)
        )

        .addStringOption(option =>
            option
                .setName('type')
                .setDescription('Type of event')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Battle',
                        value: 'Battle',
                    },
                    {
                        name: 'Invasion',
                        value: 'Invasion',
                    },
                    {
                        name: 'Defense',
                        value: 'Defense',
                    }
                )
        ),

    async execute(interaction) {
        // Only Army Leaders can register
        if (!interaction.member.roles.cache.has(ARMY_LEADER_ROLE_ID)) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Permission Denied',
                        'Only **Army Leaders** can use `/register`.'
                    ),
                ],
                ephemeral: true,
            });
        }

        const battleName = interaction.options.getString('battle_name');
        const army = interaction.options.getString('army');
        const dateTime = interaction.options.getString('date_time');
        const type = interaction.options.getString('type');

        if (!parseRegistrationDateTime(dateTime)) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [errorEmbed('Invalid Date and Time', REGISTRATION_DATE_TIME_HELP)],
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 CPAF Battle Registration')
            .setDescription(
                `**BATTLE NAME**\n` +
                `${battleName}\n\n` +

                `**Army:**\n` +
                `${army}\n\n` +

                `**Date and Time**\n` +
                `${dateTime}\n\n` +

                `**Type:**\n` +
                `${type}\n\n` +

                `**Status:** 🟡 Awaiting Review`
            )
            .setColor(0xF1C40F)
            .setFooter({
                text: `Registered by ${interaction.user.tag}`,
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cpaf_register_accept')
                .setLabel('ACCEPT')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('cpaf_register_decline')
                .setLabel('DECLINE')
                .setStyle(ButtonStyle.Danger)
        );

        const reviewMentions = REVIEW_ROLE_IDS
            .map(roleId => `<@&${roleId}>`)
            .join(' ');

        return InteractionHelper.safeReply(interaction, {
            content: reviewMentions,

            embeds: [embed],

            components: [buttons],

            allowedMentions: {
                roles: REVIEW_ROLE_IDS,
            },
        });
    },
};
