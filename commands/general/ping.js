const { SlashCommandBuilder } = require("discord.js");
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Verifie la latence du bot."),
    async execute(interaction) {

        // Au début, nous différons pour éviter l'échec de l'interaction Discord
        await interaction.deferReply({
            ephemeral: true
        });

        // Répondre à l'utilisateur
        await interaction.editReply({
            content: `Ping ?`,
        });

        // Attendre 500ms
        await wait(500);

        // Mettre à jour la réponse
        await interaction.editReply({
            content: `Latence API actuelle : ${Math.round(interaction.client.ws.ping)}ms`
        });
    }
}
