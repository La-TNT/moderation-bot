const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mimic")
        .setDescription("Commande de mimétisme non éphémère. Je dirai ce que vous faites.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("Ce que vous aimeriez que je dise au serveur")
                .setRequired(true)
        ),
    async execute(interaction) {

        await interaction.deferReply({
            ephemeral: true
        });

        interaction.channel.send({
            content: interaction.options.getString("message")
        });

        await interaction.editReply({
            content: "Votre souhait est mon ordre."
        });
    }
}
