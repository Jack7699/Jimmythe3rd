import {
    SlashCommandBuilder,
    PermissionFlagsBits,
} from 'discord.js';

import { errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const STAFF_ROLE_IDS = [
    '1543710638025605270', // Chief Officer
    '1548015112785498203', // CO-In-Training
    '1543710552868786186', // Head Moderator
];

function normalizeHexColor(value) {
    return value.startsWith('#') ? value : `#${value}`;
}

export default {
    data: new SlashCommandBuilder()
        .setName('armyregister')
        .setDescription('Register an army and create its Army Role')
        .addStringOption(option =>
            option
                .setName('armyname')
                .setDescription('Name of the army')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('colorhex')
                .setDescription('Hex color for the Army Role, e.g. #5865F2')
                .setRequired(true)
        ),

    async execute(interaction) {
        // Check staff permissions
        const canRegister = STAFF_ROLE_IDS.some(roleId =>
            interaction.member.roles.cache.has(roleId)
        );

        if (!canRegister) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Permission Denied',
                        'Only **Chief Officers, CO-In-Training, and Head Mods** can use `/armyregister`.'
                    ),
                ],
                ephemeral: true,
            });
        }

        const armyName = interaction.options
            .getString('armyname')
            .trim();

        const colorInput = interaction.options
            .getString('colorhex')
            .trim();

        const colorHex = normalizeHexColor(colorInput);

        // Validate army name
        if (armyName.length < 1 || armyName.length > 100) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Invalid Army Name',
                        'The army name must be between 1 and 100 characters.'
                    ),
                ],
                ephemeral: true,
            });
        }

        // Validate hex color
        if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Invalid Color',
                        'Use a valid 6-digit hex color, for example **#FF0000**.'
                    ),
                ],
                ephemeral: true,
            });
        }

        // Check for existing role
        const existingRole = interaction.guild.roles.cache.find(
            role => role.name.toLowerCase() === armyName.toLowerCase()
        );

        if (existingRole) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Army Already Registered',
                        `The Army Role **${existingRole.name}** already exists.`
                    ),
                ],
                ephemeral: true,
            });
        }

        // Check Manage Roles permission
        if (
            !interaction.guild.members.me?.permissions.has(
                PermissionFlagsBits.ManageRoles
            )
        ) {
            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Missing Permission',
                        'I need the **Manage Roles** permission to create Army Roles.'
                    ),
                ],
                ephemeral: true,
            });
        }

        try {
            // Create the Army Role
            const armyRole = await interaction.guild.roles.create({
                name: armyName,
                color: colorHex,
                reason: `CPAF Army Registration by ${interaction.user.tag}`,
            });

            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    {
                        title: '🏛️ Army Registered',
                        description:
                            `**Army:** ${armyName}\n` +
                            `**Army Role:** ${armyRole}\n` +
                            `**Color:** \`${colorHex.toUpperCase()}\`\n` +
                            `**Registered by:** ${interaction.user}`,
                        color: parseInt(colorHex.slice(1), 16),
                        timestamp: new Date().toISOString(),
                    },
                ],
            });
        } catch (error) {
            console.error('Army registration error:', error);

            return InteractionHelper.safeReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Registration Failed',
                        'I could not create the Army Role. Make sure my bot role is high enough in the server role list and that I have **Manage Roles** permission.'
                    ),
                ],
                ephemeral: true,
            });
        }
    },
};
