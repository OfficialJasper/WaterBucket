import { Message } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

const handlers = new Map<string, (message: Message, args: string[]) => Promise<void>>();

let loaded = false;

async function loadHandlers() {
    if (loaded) return;

    const messagesPath = join(__dirname, "..", "messages");

    const files = readdirSync(messagesPath).filter(
        file =>
            (file.endsWith(".ts") || file.endsWith(".js")) &&
            file !== "messageCreate.ts" &&
            file !== "messageCreate.js"
    );

    for (const file of files) {
        const filePath = join(messagesPath, file);
        const module = await import(filePath);
        const handler = module.default ?? module;

        if (typeof handler !== "function") continue;

        const name = file.replace(/\.(ts|js)$/, "").toLowerCase();

        handlers.set(name, handler);

        console.log(`[Messages] Loaded ${name}`);
    }

    loaded = true;
}

export default async (message: Message) => {
    if (message.author.bot) return;

    await loadHandlers();

    const content = message.content.trim();

    if (!content.startsWith("-")) return;

    const args = content.slice(1).trim().split(/\s+/);
    const command = args.shift()?.toLowerCase();

    if (!command) return;

    const handler = handlers.get(command);

    if (!handler) return;

    try {
        await handler(message, args);
    } catch (error) {
        console.error(`[Messages] ${command} failed:`, error);
    }
};