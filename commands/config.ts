import {
    ChatInputCommandInteraction,
    ContainerBuilder,
    MessageFlags,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    TextDisplayBuilder,
    PermissionFlagsBits
} from "discord.js"

export default {
    data: new SlashCommandBuilder()
      .setName('config')
      .setDescription('Configure WaterBucket')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            await interaction.reply({
                content: "This command can only be used inside a server.",
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const container = new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(`Welcome To **WaterBuckets**'s Configuration Panel, Here you can find all of our configuration options and configure them to your liking as you wish, we are a bot that protects servers from Bots that arent appropriate and ban them from the server.`)
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
                      label: "Trap-Channel",
                      value: "trap_channel"
                    },
                    {
                      label: "Ban/Softban",
                      value: "ban_softban"
                    }
                  )
            )
          );

          await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
          })
    }
}