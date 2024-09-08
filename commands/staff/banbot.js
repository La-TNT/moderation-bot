const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const blacklistFile = path.join(__dirname, '..', 'blacklist.json');

// Charger la liste noire des serveurs
let blacklist = [];
if (fs.existsSync(blacklistFile)) {
    blacklist = JSON.parse(fs.readFileSync(blacklistFile, 'utf-8'));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banbot')
        .setDescription('Bannir le bot d\'un serveur spécifique.')
        .addStringOption(option => 
            option.setName('server_id')
                .setDescription('L\'ID du serveur où bannir le bot.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const supportServerId = '1276577184244563968'; // Remplace par l'ID de ton serveur support
        const userServerId = interaction.guild.id;

        // Vérifier si la commande est utilisée sur le serveur support
        if (userServerId !== supportServerId) {
            return interaction.reply({ content: 'Cette commande est uniquement disponible sur le serveur support.', ephemeral: true });
        }

        const targetServerId = interaction.options.getString('server_id');

        // Vérifier si le serveur est déjà blacklisté
        if (blacklist.includes(targetServerId)) {
            return interaction.reply({ content: `Le serveur avec l'ID ${targetServerId} est déjà dans la liste noire.`, ephemeral: true });
        }

        const targetServer = interaction.client.guilds.cache.get(targetServerId);

        // Vérifier si le bot est dans le serveur cible
        if (!targetServer) {
            return interaction.reply({ content: `Le bot n'est pas présent dans le serveur avec l'ID: ${targetServerId}.`, ephemeral: true });
        }

        try {
            // Ajouter le serveur à la liste noire
            blacklist.push(targetServerId);
            fs.writeFileSync(blacklistFile, JSON.stringify(blacklist));

            // Quitter le serveur cible
            await targetServer.leave();
            await interaction.reply(`Le bot a été banni et a quitté le serveur avec l'ID: ${targetServerId}.`);
        } catch (error) {
            console.error('Erreur en quittant le serveur :', error);
            await interaction.reply({ content: 'Une erreur s\'est produite lors de la tentative de bannir le bot du serveur.', ephemeral: true });
        }
    },
};
