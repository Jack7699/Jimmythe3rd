import { EmbedBuilder } from 'discord.js';
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

            const embed = EmbedBuilder.from(originalEmbed);

            const description = originalEmbed.description.replace(
                /\*\*Status:\*\*[\s\S]*$/,
                `**Status:** 🟢 ACCEPTED\n\n**Reviewed by:** ${interaction.user}`
            );

            embed
                .setDescription(description)
                .setColor(0x2ecc71);

            await interaction.message.edit({
                embeds: [embed],
                components: interaction.message.components,
            });

            await interaction.reply({
                content: '✅ Registration accepted.',
                ephemeral: true,
            });

            logger.info(
                `CPAF registration accepted by ${interaction.user.tag}`
            );
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
