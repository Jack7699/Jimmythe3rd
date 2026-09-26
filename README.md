# Jimmythe3rd

Jimmythe3rd is a Discord bot used for **CPA Force**. It combines army and event registration with moderation, tickets, verification, applications, and other community tools. This repository is based on [TitanBot](https://github.com/codebymitch/TitanBot) and contains CPA Force-specific commands and configuration.

The CPA Force commands currently use role IDs from one server. If you deploy the bot elsewhere, update those IDs in [`src/commands/register.js`](src/commands/register.js), [`src/commands/Tools/armyregister.js`](src/commands/Tools/armyregister.js), and [`src/interactions/buttons/registerButtons.js`](src/interactions/buttons/registerButtons.js) before using those workflows.

## What it does

| Area | Examples |
| --- | --- |
| CPA Force | `/armyregister` creates an army role; `/register` submits a battle or event for staff review. Accepting a registration attempts to create a 30-minute Discord scheduled event. |
| Server management | Moderation commands, user notes, cases, logging, tickets, verification, welcome messages, reaction roles, and server counters. |
| Community | Role applications, giveaways, birthdays, leveling, and join-to-create voice channels. |
| Extras | Economy, polls, utilities, games, and music through Lavalink. |

Use `/help` in Discord to explore the commands available in your deployment. Some commands require staff roles or Discord permissions, and some features need server-specific setup.

## Run with Docker Compose

You need Docker with Compose and a Discord bot application.

1. Clone **this repository** and create an environment file:

   ```sh
   git clone https://github.com/Jack7699/Jimmythe3rd.git
   cd Jimmythe3rd
   cp .env.example .env
   ```

   In PowerShell, use `Copy-Item .env.example .env` for the last command.

2. Edit `.env`. Set `DISCORD_TOKEN` and `CLIENT_ID` from your Discord application. Replace the example `POSTGRES_PASSWORD` with a strong password. `GUILD_ID` is shown in the example file for setup convenience; slash commands are registered globally using `CLIENT_ID`.
3. Start the bot and bundled PostgreSQL database:

   ```sh
   docker compose up -d --build
   docker compose ps
   ```

4. Check the HTTP endpoints at `http://localhost:3000/health` and `http://localhost:3000/ready`. The first reports process and database status; the second reports whether the bot is ready.

The Compose deployment keeps PostgreSQL data in the `postgres_data` volume. The bot applies migrations at startup when `AUTO_MIGRATE=true`, as set in [`docker-compose.yml`](docker-compose.yml). Do not commit your `.env` file or bot token.

## Run with Node.js

Use Node.js **20.10 or newer** and a PostgreSQL server. From a clone of this repository:

```sh
cp .env.example .env
npm ci
npm start
```

Set `DISCORD_TOKEN`, `CLIENT_ID`, and the PostgreSQL connection values in `.env` before starting. Set `POSTGRES_URL` to the connection string for your database, or leave it blank to use `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`. See [`.env.example`](.env.example) for the other options.

PostgreSQL is the persistent store. If it is unavailable, the bot can start in a degraded in-memory mode, but data written there is lost when the process restarts. Fix the database connection before relying on the bot for production data. Database scripts include `npm run migrate`, `npm run migrate:check`, `npm run backup:db`, and `npm run restore:db`.

## Discord setup

Create an application and bot in the [Discord Developer Portal](https://discord.com/developers/applications), then invite it with the `bot` and `applications.commands` scopes. The bot requests these gateway intents in [`src/app.js`](src/app.js): Guilds, Guild Members, Guild Messages, Guild Message Reactions, Message Content, Direct Messages, Guild Voice States, and Guild Bans. Enable the privileged intents your deployment uses in the Developer Portal.

Grant permissions for the features you plan to use. In particular, army role creation needs **Manage Roles**, accepted registrations need **Manage Events**, ticket setup needs **Manage Channels**, and moderation actions need their corresponding moderation permissions. Music also needs access to join and speak in voice channels. Keep the bot's role above roles it must manage.

`/register` accepts an ISO 8601 date and time such as `2026-09-28T20:00:00+01:00`, or a Discord timestamp such as `<t:1790622000:F>` (any Discord timestamp display style works). Invalid values are rejected when the command is submitted. A reviewer with one of the configured CPA Force review roles can accept or decline it. The scheduled event is created on acceptance, so the bot needs Manage Events permission at that point.

## Music

Music uses Lavalink v4 through Riffy. The default node list is in [`lavalink/nodes.json`](lavalink/nodes.json); availability of public nodes can change. You can configure your own nodes with `LAVALINK_NODES` or `LAVALINK_NODES_FILE`, or use the single-node `LAVALINK_HOST`, `LAVALINK_PORT`, and `LAVALINK_PASSWORD` settings when no node list is loaded. See [`src/config/music/lavalink.js`](src/config/music/lavalink.js) for the selection order.

## Contributing and provenance

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidance and [SECURITY.md](SECURITY.md) for private vulnerability reporting. Jimmythe3rd builds on [codebymitch/TitanBot](https://github.com/codebymitch/TitanBot); the code is available under the [MIT License](LICENSE).
