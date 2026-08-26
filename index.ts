import "dotenv/config";
import express from "express";
import { Client, Collection, GatewayIntentBits, REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
}) as Client & {
    commands: Collection<string, any>;
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = Number(process.env.PORT) || 3000;
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
    throw new Error("DISCORD_TOKEN is missing from .env");
}

if (!CLIENT_ID) {
    throw new Error("CLIENT_ID is missing from .env");
}

client.commands = new Collection();

async function loadCommands() {
    const commandsPath = join(__dirname, "commands");

    try {
        const files = readdirSync(commandsPath).filter(
            file => file.endsWith(".ts") || file.endsWith(".js")
        );

        for (const file of files) {
            const filePath = join(commandsPath, file);
            const command = await import(filePath);

            const data = command.default ?? command;

            if (!data?.data || !data?.execute) {
                console.warn(`[Commands] Invalid command: ${file}`);
                continue;
            }

            client.commands.set(data.data.name, data);

            console.log(`[Commands] Loaded ${data.data.name}`);
        }
    } catch (error) {
        console.error("[Commands] Failed to load commands:", error);
    }
}

async function loadMessages() {
    const messagesPath = join(__dirname, "messages");

    try {
        const files = readdirSync(messagesPath).filter(
            file => file.endsWith(".ts") || file.endsWith(".js")
        );

        for (const file of files) {
            const filePath = join(messagesPath, file);
            const message = await import(filePath);

            const handler = message.default ?? message;

            if (typeof handler !== "function") {
                console.warn(`[Messages] Invalid message handler: ${file}`);
                continue;
            }

            client.on("messageCreate", handler);

            console.log(`[Messages] Loaded ${file}`);
        }
    } catch (error) {
        console.error("[Messages] Failed to load:", error);
    }
}

async function loadAPI() {
    const apiPath = join(__dirname, "api");

    try {
        const files = readdirSync(apiPath).filter(
            file => file.endsWith(".ts") || file.endsWith(".js")
        );

        for (const file of files) {
            const filePath = join(apiPath, file);
            const api = await import(filePath);

            const register = api.default ?? api.register;

            if (typeof register !== "function") {
                console.warn(`[API] Invalid API module: ${file}`);
                continue;
            }

            await register(app);

            console.log(`[API] Loaded ${file}`);
        }
    } catch (error) {
        console.error("[API] Failed to load:", error);
    }
}

async function loadDatabase() {
    const databasePath = join(__dirname, "database");

    try {
        const files = readdirSync(databasePath).filter(
            file =>
                (file.endsWith(".ts") || file.endsWith(".js")) &&
                !file.endsWith(".d.ts")
        );

        for (const file of files) {
            const filePath = join(databasePath, file);
            const database = await import(filePath);

            const init =
                database.init ??
                database.connect ??
                database.default;

            if (typeof init !== "function") {
                continue;
            }

            await init();

            console.log(`[Database] Loaded ${file}`);
        }
    } catch (error) {
        console.error("[Database] Failed to initialize:", error);
        throw error;
    }
}

async function registerCommands() {
    const commands = [];

    for (const command of client.commands.values()) {
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "10" }).setToken(TOKEN!);

    await rest.put(
        Routes.applicationCommands(CLIENT_ID!),
        {
            body: commands
        }
    );

    console.log(`[Commands] Registered ${commands.length} global commands`);
}

client.once("ready", async () => {
    console.log(`[Discord] Logged in as ${client.user?.tag}`);

    client.user?.setPresence({
        activities: [
            {
                name: "Protecting your servers.",
                type: 3
            }
        ],
        status: "dnd"
    });
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        return;
    }

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(
            `[Commands] ${interaction.commandName} failed:`,
            error
        );

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: "An error occurred while executing this command.",
                ephemeral: true
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: "An error occurred while executing this command.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

async function start() {
    try {
        console.log("[System] Starting bot...");

        await loadDatabase();
        await loadCommands();
        await loadMessages();
        await loadAPI();

        await registerCommands();

        app.listen(PORT, () => {
            console.log(`[API] Listening on port ${PORT}`);
        });

        await client.login(TOKEN);
    } catch (error) {
        console.error("[System] Startup failed:", error);
        process.exit(1);
    }
}

start();