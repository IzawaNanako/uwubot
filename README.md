# Nanaz

A multi-purpose Discord bot built with TypeScript.

## Description

Nanaz is a multi-purpose Discord bot built with TypeScript. It provides a comprehensive suite of features including server moderation, seamless text translation, interactive games, and AI-driven conversational capabilities. The bot utilizes Sequelize for flexible database management and is designed to be easily deployable in various environments, with Docker provided as the standard streamlined solution.

## Features

- **AI Conversational Persona:** Integrates the Gemini API to respond to user messages, adhering to a configurable persona. The bot interacts dynamically, with specific contextual awareness granted to the configured bot owner.
- **Advanced Translation Integration:** Utilizes the DeepL API for high-quality translations. Features include a standard `/translate` command, a context menu translation action, and a `/send` command that translates the user's message into a target language prior to sending.
- **Interactive Mini-Games:** Users can initiate games such as Rock-Paper-Scissors and Tic-Tac-Toe using the `/challenge` command. Matches can be played against other server members or directly against the bot.
- **Moderation & Utility Tools:** Includes standard moderation commands and server management utilities.
- **Multilingual Support:** Fully localized through Crowdin. A GitHub Action workflow automatically synchronizes English source strings to Crowdin upon commit, and opens Pull Requests for newly approved translations.

## Tech Stack

- **Language:** TypeScript
- **Core Library:** discord.js
- **Database ORM:** Sequelize
- **Compiler:** SWC / tsc
- **APIs:** Google Gemini API, DeepL API
- **Localization:** Crowdin

## Getting Started

### Prerequisites

- A [Discord Developer](https://discord.com/developers/applications) application with a Bot Token and Client ID
- A [Gemini API Key](https://aistudio.google.com/)
- A [DeepL API Key](https://www.deepl.com/pro-api)
- **For Docker Setup:** [Docker](https://www.docker.com/) and Docker Compose
- **For Manual Setup:** Node.js (v16.x or higher), a package manager (npm/yarn/pnpm), and a configured SQL database (PostgreSQL recommended).

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/IzawaNanako/nanaz-bot.git
    cd nanaz-bot
    ```

2. Rename the `.env.example` file to `.env` and populate it with your credentials:

| Variable         | Description                                                 | Required | Default    |
| ---------------- | ----------------------------------------------------------- | -------- | ---------- |
| `TOKEN`          | Your Discord Bot Token.                                     | Yes      | -          |
| `CLIENT_ID`      | Your Discord Application Client ID.                         | Yes      | -          |
| `MODEL_NAME`     | The Gemini model to use (e.g., `gemini-3.5-flash`).         | Yes      | -          |
| `GEMINI_API_KEY` | Your Google Gemini API Key.                                 | Yes      | -          |
| `DEEPL_API_KEY`  | Your DeepL API Key.                                         | Yes      | -          |
| `DATABASE`       | The name of the database.                                   | Yes      | `database` |
| `DB_USER`        | The database username.                                      | Yes      | `user`     |
| `DB_PASSWORD`    | The database password.                                      | Yes      | `password` |
| `DB_DIALECT`     | The database dialect used by Sequelize.                     | Yes      | `postgres` |
| `DB_HOST`        | The database host address.                                  | Yes      | `nanazdb`  |
| `DB_PORT`        | The database port.                                          | Yes      | `5432`     |
| `GUILD_ID`       | The ID of your primary or development Discord server.       | No       | -          |
| `OWNER_ID`       | The Discord User ID of the bot owner (used for AI persona). | No       | -          |
| `SUPPORT_SERVER` | An invite link to the bot's support server.                 | No       | -          |

_Optional variables can be left blank or as default values, but the keys should not be deleted from the `.env` file._

### Deployment

#### Option A: Docker (Recommended)

Docker provides a streamlined, one-click startup. The provided configuration also includes an Adminer container for database management, which can be stopped if not needed.

1. Ensure your `.env` is configured.
2. Start the container stack:

   ```bash
   # Windows users can utilize the provided batch script:
   start.bat

   # Or use Docker Compose directly:
   docker compose up -d --build
   ```

#### Option B: Manual Setup

If you prefer to host the bot on a dedicated environment without Docker, follow these steps:

1. Provision and start your database server (e.g., PostgreSQL).
2. Update the database variables in your .env (DATABASE, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_DIALECT) to match your manual database setup.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the project:

   ```bash
   npm run build
   ```

5. Synchronize the database schema:

   ```bash
   npm run syncdb
   ```

6. Start the bot:

   ```bash
   node dist/index.js
   ```

### Command Deployment

Regardless of your deployment method, you must deploy the application commands to the Discord API for them to appear in your server.

Run one of the following scripts from your local machine:

```bash
# For global deployment (production, update time can vary)
npm run deploy-global

# For immediate testing in a specific server (Requires GUILD_ID in .env)
npm run deploy-guild
```

## Localization Workflow

This project relies on community-driven localization.

- The default language is English (`en-US`).
- Additions, deletions, or modifications to strings in the English locale files are automatically synchronized to Crowdin via GitHub Actions during a commit.
- Completed translations on Crowdin automatically trigger a Pull Request to this repository for manual review and merging.
- For the translations to apply, you must redeploy the bot after pulling the latest changes.

## License

This project is licensed under the GPL-3.0 License - see [LICENSE](/LICENSE) for details.
