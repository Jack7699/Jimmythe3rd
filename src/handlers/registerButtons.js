import { EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { replyUserError, ErrorTypes } from '../utils/errorHandler.js';

const REVIEW_ROLE_IDS = [
    '1543710638025605270', // Chief Officer
    '1548015112785498203', // CO-In-Training
    '1543710552868786186', // Head Moderator
];

async function registerButtonHandler(interaction) {
    try {
        // Only Chief Officers, CO-In-Training, and Head Moderators
        // can accept or decline registrations.
        const canReview = REVIEW_ROLE_IDS.some(roleId =>
            interaction.member.roles.cache.has(roleId)
        );

        if (!canReview) {
            return await interaction.reply({
                content:
                    '❌ You do not have permission to review CPAF registrations.',
                flags: ['Ephemeral'],
            });
        }

        const accepted =
            interaction.customId === 'cpaf_register_accept';

        const declined =
            interaction.customId === 'cpaf_register_decline';

        if (!accepted && !declined) return;

        const originalEmbed = interaction.message.embeds[0];

        if (!originalEmbed) {
            return await interaction.reply({
                content: '❌ This registration embed could not be found.',
                flags: ['Ephemeral'],
            });
        }

        const embed = EmbedBuilder.from(originalEmbed);

        const status = accepted
            ? '🟢 ACCEPTED'
            : '🔴 DECLINED';

        embed.setDescription(
            originalEmbed.description
                .replace(
                    /\*\*Status:\*\* .*/,
                    `**Status:** ${status}\n\n**Reviewed by:** ${interaction.user}`
                )
        );

        embed.setColor(
            accepted
                ? 0x2ecc71
                : 0xe74c3c
        );

        await interaction.message.edit({
            embeds: [embed],
            // Buttons intentionally stay active.
            // Another authorized reviewer can override the decision.
            components: interaction.message.components,
        });

        await interaction.reply({
            content: accepted
                ? '✅ Registration accepted.'
                : '❌ Registration declined.',
            flags: ['Ephemeral'],
        });

        logger.info(
            `CPAF registration ${accepted ? 'accepted' : 'declined'} by ${interaction.user.tag}`
        );
    } catch (error) {
        logger.error('CPAF registration button handler error:', error);

        try {
            if (!interaction.replied && !interaction.deferred) {
                await replyUserError(interaction, {
                    type: ErrorTypes.UNKNOWN,
                    message:
                        'An error occurred while reviewing this registration.',
                });
            }
        } catch (err) {
            logger.error(
                'Failed to send registration error message:',
                err
            );
        }
    }
}

export default registerButtonHandler;
export { registerButtonHandler };
