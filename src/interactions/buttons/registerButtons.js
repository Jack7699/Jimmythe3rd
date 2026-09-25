import {
    EmbedBuilder,
    GuildScheduledEventEntityType,
    GuildScheduledEventPrivacyLevel,
} from 'discord.js';

import { logger } from '../../utils/logger.js';

const REVIEW_ROLE_IDS = [
    '1543710638025605270', // Chief Officer
    '1548015112785498203', // CO-In-Training
    '1543710552868786186', // Head Moderator
];

export default [
    {
        name: 'cpaf_register_accept',

        async execute(interaction) {
            const canReview = REVIEW_ROLE_IDS.some(roleId =>
                interaction.member.roles.cache.has(roleId)
            );

            if (!canReview) {
                return interaction.reply({
                    content:
                        '❌ You do not have permission to review CPAF registrations.',
                    ephemeral: true,
                });
            }

            const originalEmbed = interaction.message.embeds[0];

            if (!originalEmbed) {
                return interaction.reply({
                    content: '❌ This registration could not be found.',
                    ephemeral: true,
                });
            }

            // Extract registration information
            const description = originalEmbed.description || '';

            const battleName =
                description.match(/\*\*BATTLE NAME\*\*\n([\s\S]*?)\n\n/)?.[1]?.trim();

            const army =
                description.match(/\*\*Army:\*\*\n([\s\S]*?)\n\n/)?.[1]?.trim();

            const dateTime =
                description.match(/\*\*Date and Time\*\*\n([\s\S]*?)\n\n/)?.[1]?.trim();

            const type =
                description.match(/\*\*Type:\*\*\n([\s\S]*?)\n\n/)?.[1]?.trim();

            if (!battleName || !dateTime) {
                return interaction.reply({
                    content:
                        '❌ I could not read the battle name or date/time from this registration.',
                    ephemeral: true,
                });
            }

            /*
             * DATE/TIME
             *
             * Example:
             * 2026-09-28T20:00:00+01:00
             */
            const startTime = new Date(dateTime);

            if (Number.isNaN(startTime.getTime())) {
                return interaction.reply({
                    content:
                        '❌ Invalid date/time. Use this format:\n`2026-09-28T20:00:00+01:00`',
                    ephemeral: true,
                });
            }

            // Discord event duration: 30 minutes
            const endTime = new Date(
                startTime.getTime() + 30 * 60 * 1000
            );

            try {
                /*
                 * CREATE DISCORD SCHEDULED EVENT
                 */
                const scheduledEvent =
                    await interaction.guild.scheduledEvents.create({
                        name: battleName,

                        scheduledStartTime: startTime,
                        scheduledEndTime: endTime,

                        privacyLevel:
                            GuildScheduledEventPrivacyLevel.GuildOnly,

                        entityType:
                            GuildScheduledEventEntityType.External,

                        entityMetadata: {
                            location: 'CPAF Discord',
                        },

                        description:
                            `⚔️ CPAF ${type || 'Battle'}\n\n` +
                            `**Army:** ${army || 'Not specified'}\n` +
                            `**Type:** ${type || 'Battle'}\n\n` +
                            `Registered through CPAF.`,

                        reason:
                            `CPAF registration approved by ${interaction.user.tag}`,
                    });

                /*
                 * UPDATE REGISTRATION EMBED
                 */
                const embed = EmbedBuilder.from(originalEmbed);

                const updatedDescription = description.replace(
                    /\*\*Status:\*\*[\s\S]*$/,
                    `**Status:** 🟢 ACCEPTED\n\n` +
                    `**Reviewed by:** ${interaction.user}\n\n` +
                    `**Discord Event:** ${scheduledEvent}`
                );

                embed
                    .setDescription(updatedDescription)
                    .setColor(0x2ecc71);

                await interaction.message.edit({
                    embeds: [embed],
                    components: interaction.message.components,
                });

                await interaction.reply({
                    content:
                        `✅ Registration accepted!\n\n` +
                        `📅 **Discord event created:** ${scheduledEvent}`,
                    ephemeral: true,
                });

                logger.info(
                    `CPAF registration accepted by ${interaction.user.tag} — ` +
                    `Discord event created: ${scheduledEvent.id}`
                );
            } catch (error) {
                logger.error(
                    `Failed to create CPAF Discord event: ${error.message}`
                );

                return interaction.reply({
                    content:
                        '❌ Registration was not completed because I could not create the Discord event. Make sure I have **Manage Events** permission.',
                    ephemeral: true,
                });
            }
        },
    },

    {
        name: 'cpaf_register_decline',

        async execute(interaction) {
            const canReview = REVIEW_ROLE_IDS.some(roleId =>
                interaction.member.roles.cache.has(roleId)
            );

            if (!canReview) {
                return interaction.reply({
                    content:
                        '❌ You do not have permission to review CPAF registrations.',
                    ephemeral: true,
                });
            }

            const originalEmbed = interaction.message.embeds[0];

            if (!originalEmbed) {
                return interaction.reply({
                    content: '❌ This registration could not be found.',
                    ephemeral: true,
                });
            }

            const embed = EmbedBuilder.from(originalEmbed);

            const description = originalEmbed.description.replace(
                /\*\*Status:\*\*[\s\S]*$/,
                `**Status:** 🔴 DECLINED\n\n**Reviewed by:** ${interaction.user}`
            );

            embed
                .setDescription(description)
                .setColor(0xe74c3c);

            await interaction.message.edit({
                embeds: [embed],
                components: interaction.message.components,
            });

            await interaction.reply({
                content: '❌ Registration declined.',
                ephemeral: true,
            });

            logger.info(
                `CPAF registration declined by ${interaction.user.tag}`
            );
        },
    },
];
