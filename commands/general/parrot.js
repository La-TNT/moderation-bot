const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("parrot")
        .setDescription("Je répéterai ce que vous me dites !")
        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("Le message que vous voulez que je répète")
                .setRequired(true)
        ),
    async execute(interaction) {

        // Au début, nous différons pour éviter l'échec de l'interaction Discord
        await interaction.deferReply({
            ephemeral: true
        });

        // Répondre avec ce que l'utilisateur a dit
        await interaction.editReply({
            content: "*Je vous répète :* " + interaction.options.getString("message")
        });
    }
}
