import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

const TOP_TENS = {
    'August 30 - September 6': [
        '🥇 Greater Warriors',
        '🥈 Snowwalkers of Club Penguin',
        '🥉 The Cult of Tung',
        '4️⃣ United Republic of Club Penguin',
        '5️⃣ Magicians of Club Penguin',
    ],

    'September 6 - September 11': [
        '🥇 Cult of Tung',
        '🥈 Black Ops',
        '🥉 Snowwalkers of Club Penguin',
        '4️⃣ Magicians of Club Penguin',
    ],

    'September 11 - September 18': [
        '🥇 Boxmen of Boxland',
        '🥈 Black Ops',
        '3️⃣ Snowwalkers of Club Penguin',
        '4️⃣ Magicians',
    ],

    'September 18 - September 25': [
        '🥇 Coming soon',
        '🥈 Coming soon',
        '🥉 Coming soon',
    ],
};

export default {
    data: new SlashCommandBuilder()
        .setName('topten')
        .setDescription('View the CPAF Top Ten for a specific week')
        .addStringOption(option =>
            option
                .setName('week')
                .setDescription('Select the Top Ten week')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'August 30 - September 6',
                        value: 'August 30 - September 6',
                    },
                    {
                        name: 'September 6 - September 11',
                        value: 'September 6 - September 11',
                    },
                    {
                        name: 'September 11 - September 18',
                        value: 'September 11 - September 18',
                    },
                    {
                        name: 'September 18 - September 25',
                        value: 'September 18 - September 25',
                    },
                )
        ),

    async execute(interaction) {
        const deferSuccess = await InteractionHelper.safeDefer(interaction);

        if (!deferSuccess) return;

        const week = interaction.options.getString('week');
        const rankings = TOP_TENS[week];

        if (!rankings) {
            await InteractionHelper.safeEditReply(interaction, {
                embeds: [
                    errorEmbed(
                        'Top Ten Not Found',
                        `There is no CPAF Top Ten available for **${week}**.`
                    ),
                ],
            });
            return;
        }

        const description = rankings.join('\n');

        const embed = successEmbed(
            `🏆 CPAF Top Ten`,
            `**${week}**\n\n${description}`
        );

        await InteractionHelper.safeEditReply(interaction, {
            embeds: [embed],
        });
    },
};
