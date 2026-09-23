import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';

/*
 * Guess the Army
 *
 * 3 clues:
 * Clue 1 = 3 points
 * Clue 2 = 2 points
 * Clue 3 = 1 point
 *
 * The game is stored in memory, so scores reset if the bot restarts.
 *
 * The armies below are historical Club Penguin Army names.
 */

const ARMIES = [
  {
    name: 'Army of Club Penguin',
    aliases: ['ACP', 'Army of Club Penguin'],
    clues: [
      'Its abbreviation is ACP.',
      'It was founded by Oagalthorp.',
      'It became one of the most prominent armies in Club Penguin Army history.',
    ],
  },
  {
    name: 'Rebel Penguin Federation',
    aliases: ['RPF', 'Rebel Penguin Federation'],
    clues: [
      'Its abbreviation is RPF.',
      'It was founded by Commando717.',
      'It became one of the longest-running and most prominent Club Penguin armies.',
    ],
  },
  {
    name: 'Underground Mafias Army',
    aliases: ['UMA', 'Underground Mafias Army'],
    clues: [
      'Its abbreviation is UMA.',
      'It was one of the major armies of the early Club Penguin Army era.',
      'It was involved in major conflicts during the early Club Penguin Army World Wars.',
    ],
  },
  {
    name: 'Ice Warriors',
    aliases: ['IW', 'Ice Warriors'],
    clues: [
      'Its abbreviation is IW.',
      'Its name is based around ice.',
      'It was one of the major armies of the classic Club Penguin Army era.',
    ],
  },
  {
    name: 'Doritos',
    aliases: ['DCP', 'Doritos', 'Doritos of Club Penguin'],
    clues: [
      'Its abbreviation is DCP.',
      'Its name comes from a popular snack.',
      'It became one of the notable armies of the classic CPA community.',
    ],
  },
  {
    name: 'Watex Warriors',
    aliases: ['WW', 'Watex Warriors'],
    clues: [
      'Its name contains the word "Warriors".',
      'It was associated with Watex.',
      'It became a notable army during the classic era of Club Penguin Armies.',
    ],
  },
  {
    name: 'Night Warriors',
    aliases: ['NW', 'Night Warriors'],
    clues: [
      'Its abbreviation is NW.',
      'Its name refers to nighttime.',
      'It became a prominent army during the classic-era CPA community.',
    ],
  },
  {
    name: 'Army Republic',
    aliases: ['AR', 'Army Republic'],
    clues: [
      'Its abbreviation is AR.',
      'Its name contains the word "Republic".',
      'It was a notable army during the 2010s era of Club Penguin Armies.',
    ],
  },
  {
    name: 'Club Penguin Air Force',
    aliases: ['CPAF', 'Club Penguin Air Force'],
    clues: [
      'Its abbreviation is CPAF.',
      'Its name refers to an air force.',
      'It was one of the early armies in Club Penguin Army history.',
    ],
  },
  {
    name: 'United Penguin Army',
    aliases: ['UPA', 'United Penguin Army'],
    clues: [
      'Its abbreviation is UPA.',
      'Its name contains the word "United".',
      'It was formed through a merger involving earlier Club Penguin armies.',
    ],
  },
  {
    name: 'People’s Republic Army',
    aliases: ['PRA', "People's Republic Army", 'People’s Republic Army'],
    clues: [
      'Its abbreviation is PRA.',
      'Its name contains the words "People" and "Republic".',
      'It was founded by CollinZfresh.',
    ],
  },
  {
    name: 'Romans',
    aliases: ['Romans', 'Roman Army'],
    clues: [
      'Its name refers to an ancient civilization.',
      'It was one of the early armies in Club Penguin Army history.',
      'Its theme was based around ancient Rome.',
    ],
  },
  {
    name: 'Club Penguin Marines',
    aliases: ['CPM', 'Club Penguin Marines', 'Marines'],
    clues: [
      'Its abbreviation is CPM.',
      'Its name refers to a military force associated with the sea.',
      'It was an early Club Penguin Army.',
    ],
  },
];

/*
 * Active games:
 * guildId -> {
 *   army,
 *   clueNumber,
 *   messageId,
 *   channelId,
 *   startedAt
 * }
 */
const activeGames = new Map();

/*
 * Leaderboards:
 * guildId -> Map(userId -> {
 *   name,
 *   points,
 *   correct
 * })
 */
const leaderboards = new Map();

function normalizeAnswer(answer) {
  return answer
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function isCorrectAnswer(answer, army) {
  const normalized = normalizeAnswer(answer);

  return army.aliases.some(
    (alias) => normalizeAnswer(alias) === normalized,
  );
}

function getPointsForClue(clueNumber) {
  if (clueNumber === 1) return 3;
  if (clueNumber === 2) return 2;
  return 1;
}

function getLeaderboard(guildId) {
  if (!leaderboards.has(guildId)) {
    leaderboards.set(guildId, new Map());
  }

  return leaderboards.get(guildId);
}

function addScore(guildId, user, points) {
  const leaderboard = getLeaderboard(guildId);

  const current = leaderboard.get(user.id) || {
    name: user.username,
    points: 0,
    correct: 0,
  };

  current.name = user.username;
  current.points += points;
  current.correct += 1;

  leaderboard.set(user.id, current);
}

function buildLeaderboard(guildId) {
  const leaderboard = getLeaderboard(guildId);

  if (leaderboard.size === 0) {
    return 'No scores yet. Start playing with `/guessarmy`!';
  }

  const sorted = [...leaderboard.values()]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      return b.correct - a.correct;
    })
    .slice(0, 10);

  return sorted
    .map(
      (player, index) =>
        `**${index + 1}.** ${player.name} — **${player.points} pts** (${player.correct} correct)`,
    )
    .join('\n');
}

function createGameButtons(game) {
  const clueButton = new ButtonBuilder()
    .setCustomId(`guessarmy_clue_${game.clueNumber + 1}`)
    .setLabel(
      game.clueNumber >= 3
        ? 'All Clues Shown'
        : `Reveal Clue ${game.clueNumber + 1}`,
    )
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(game.clueNumber >= 3);

  const guessButton = new ButtonBuilder()
    .setCustomId('guessarmy_guess')
    .setLabel('Make a Guess')
    .setStyle(ButtonStyle.Primary);

  const leaderboardButton = new ButtonBuilder()
    .setCustomId('guessarmy_leaderboard')
    .setLabel('Leaderboard')
    .setStyle(ButtonStyle.Success);

  return new ActionRowBuilder().addComponents(
    clueButton,
    guessButton,
    leaderboardButton,
  );
}

function createGameEmbed(game) {
  const visibleClues = game.army.clues
    .slice(0, game.clueNumber)
    .map((clue, index) => `**Clue ${index + 1}:** ${clue}`)
    .join('\n\n');

  const points = getPointsForClue(game.clueNumber);

  return new EmbedBuilder()
    .setTitle('🕵️ Guess the Army')
    .setDescription(
      `Guess which **Club Penguin Army** this is!\n\n${visibleClues}`,
    )
    .addFields({
      name: 'Current reward',
      value: `**${points} point${points === 1 ? '' : 's'}**`,
      inline: true,
    })
    .setFooter({
      text: `Clue ${game.clueNumber}/3 • Guess before revealing another clue!`,
    });
}

export default {
  data: new SlashCommandBuilder()
    .setName('guessarmy')
    .setDescription('Guess a real Club Penguin Army from historical clues')
    .setDMPermission(false),

  category: 'Fun',

  async execute(interaction) {
    try {
      /*
       * If this interaction is the slash command itself,
       * start a brand-new game.
       */
      const guildId = interaction.guildId;

      if (!guildId) {
        return await replyUserError(interaction, {
          type: ErrorTypes.VALIDATION,
          message: 'This command can only be used inside a server.',
        });
      }

      if (activeGames.has(guildId)) {
        const existingGame = activeGames.get(guildId);

        return await replyUserError(interaction, {
          type: ErrorTypes.UNKNOWN,
          message: `There is already an active **Guess the Army** round in <#${existingGame.channelId}>. Finish that round first!`,
        });
      }

      const army = ARMIES[Math.floor(Math.random() * ARMIES.length)];

      const game = {
        army,
        clueNumber: 1,
        messageId: null,
        channelId: interaction.channelId,
        startedAt: Date.now(),
      };

      activeGames.set(guildId, game);

      const message = await interaction.reply({
        embeds: [createGameEmbed(game)],
        components: [createGameButtons(game)],
        fetchReply: true,
      });

      game.messageId = message.id;

      return;
    } catch (error) {
      logger.error('Guess Army command error:', error);

      if (!interaction.replied && !interaction.deferred) {
        return await replyUserError(interaction, {
          type: ErrorTypes.UNKNOWN,
          message: 'Something went wrong starting the Guess the Army game.',
        });
      }

      return await InteractionHelper.safeEditReply(interaction, {
        content: 'Something went wrong starting the Guess the Army game.',
      });
    }
  },

  /*
   * This is called by Jimmythe3rd's interaction handler.
   */
  async handleInteraction(interaction) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) {
      return false;
    }

    if (
      !interaction.customId.startsWith('guessarmy_')
    ) {
      return false;
    }

    const guildId = interaction.guildId;

    if (!guildId) {
      return true;
    }

    const game = activeGames.get(guildId);

    /*
     * -------------------------
     * LEADERBOARD BUTTON
     * -------------------------
     */
    if (interaction.customId === 'guessarmy_leaderboard') {
      const leaderboard = buildLeaderboard(guildId);

      const embed = new EmbedBuilder()
        .setTitle('🏆 Guess the Army Leaderboard')
        .setDescription(leaderboard)
        .setFooter({
          text: 'Top 10 players',
        });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });

      return true;
    }

    /*
     * -------------------------
     * NO ACTIVE GAME
     * -------------------------
     */
    if (!game) {
      await interaction.reply({
        content: 'There is no active Guess the Army round right now. Use `/guessarmy` to start one!',
        flags: MessageFlags.Ephemeral,
      });

      return true;
    }

    /*
     * -------------------------
     * REVEAL NEXT CLUE
     * -------------------------
     */
    if (interaction.customId.startsWith('guessarmy_clue_')) {
      const requestedClue = Number(
        interaction.customId.split('_').pop(),
      );

      if (requestedClue !== game.clueNumber + 1) {
        await interaction.reply({
          content: 'That clue is no longer available.',
          flags: MessageFlags.Ephemeral,
        });

        return true;
      }

      if (game.clueNumber >= 3) {
        await interaction.reply({
          content: 'All three clues have already been revealed!',
          flags: MessageFlags.Ephemeral,
        });

        return true;
      }

      game.clueNumber = requestedClue;

      await interaction.update({
        embeds: [createGameEmbed(game)],
        components: [createGameButtons(game)],
      });

      return true;
    }

    /*
     * -------------------------
     * GUESS BUTTON
     * -------------------------
     */
    if (interaction.customId === 'guessarmy_guess') {
      const modal = new ModalBuilder()
        .setCustomId('guessarmy_guess_modal')
        .setTitle('Guess the Army');

      const input = new TextInputBuilder()
        .setCustomId('guessarmy_answer')
        .setLabel('What army is this?')
        .setPlaceholder('Example: Army of Club Penguin')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(100);

      modal.addComponents(
        new ActionRowBuilder().addComponents(input),
      );

      await interaction.showModal(modal);

      return true;
    }

    /*
     * -------------------------
     * GUESS SUBMISSION
     * -------------------------
     */
    if (interaction.customId === 'guessarmy_guess_modal') {
      const answer = interaction.fields
        .getTextInputValue('guessarmy_answer')
        .trim();

      if (isCorrectAnswer(answer, game.army)) {
        const points = getPointsForClue(game.clueNumber);

        addScore(guildId, interaction.user, points);

        const leaderboard = getLeaderboard(guildId);
        const playerScore = leaderboard.get(interaction.user.id);

        activeGames.delete(guildId);

        const winnerEmbed = new EmbedBuilder()
          .setTitle('🎉 Correct!')
          .setDescription(
            `**${interaction.user.username}** guessed it!\n\n` +
            `The army was **${game.army.name}**.\n\n` +
            `You earned **${points} point${points === 1 ? '' : 's'}**!`,
          )
          .addFields({
            name: 'Your total',
            value: `**${playerScore.points} points**`,
            inline: true,
          })
          .setFooter({
            text: 'Use /guessarmy to start another round!',
          });

        await interaction.update({
          embeds: [winnerEmbed],
          components: [],
        });

        return true;
      }

      /*
       * Wrong answer.
       */
      await interaction.reply({
        content: `❌ **${answer}** isn't correct. Keep trying!`,
        flags: MessageFlags.Ephemeral,
      });

      return true;
    }

    return false;
  },
};
