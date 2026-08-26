import {
    ActionRowBuilder,
    ContainerBuilder,
    Message,
    MessageFlags,
    PermissionFlagsBits,
    StringSelectMenuBuilder,
    TextDisplayBuilder
} from "discord.js";

export default async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const prefix = "-";

    if (message.content.trim().toLowerCase() !== `${prefix}config`) {
        return;
    }

    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        await message.reply({
            content: "You need the Manage Server permission to use this command."
        });

        return;
    }

    const container = new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                "Welcome To **WaterBuckets**'s Configuration Panel, Here you can find all of our configuration options and configure them to your liking as you wish, we are a bot that protects servers from Bots that arent appropriate and ban them from the server\n\n- Trap-Channel: Not Configured Yet\n- Softban/Ban: Not Configured Yet"
            )
        )
        .addActionRowComponents(
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("config")
                    .setPlaceholder("Configuration")
                    .setMinValues(1)
                    .setMaxValues(1)
                    .addOptions(
                        {
                            label: "Trap Channel",
                            value: "trap_channel"
                        },
                        {
                            label: "Ban/SoftBan",
                            value: "ban_softban"
                        }
                    )
            )
        );

    if (!("send" in message.channel)) return;

    await message.channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [container]
    });
};