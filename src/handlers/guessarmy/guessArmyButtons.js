import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags,
} from 'discord.js';

const CLUE_BUTTON_ID = 'guessarmy-clue';
const GUESS_BUTTON_ID = 'guessarmy-guess';
const LEADERBOARD_BUTTON_ID = 'guessarmy-leaderboard';

export const guessArmyClueButton = {
    name: CLUE_BUTTON_ID,

    async execute(interaction) {
        // The actual game state will be handled here
        // once the command/game storage is connected.
        await interaction.reply({
            content: '🔎 Clue system is being connected!',
            flags: MessageFlags.Ephemeral,
        });
    },
};

export const guessArmyGuessButton = {
    name: GUESS_BUTTON_ID,

    async execute(interaction) {
        await interaction.reply({
            content: '📝 Guess system is being connected!',
            flags: MessageFlags.Ephemeral,
        });
    },
};

export const guessArmyLeaderboardButton = {
    name: LEADERBOARD_BUTTON_ID,

    async execute(interaction) {
        await interaction.reply({
            content: '🏆 Leaderboard system is being connected!',
            flags: MessageFlags.Ephemeral,
        });
    },
};
