const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Chemin vers la blacklist
const blacklistFile = path.join(__dirname, '..', 'staff', 'blacklist.json');

// Charger la liste noire des serveurs ou créer un fichier vide si non existant
let blacklist = [];
if (fs.existsSync(blacklistFile)) {
    blacklist = JSON.parse(fs.readFileSync(blacklistFile, 'utf-8'));
} else {
    fs.writeFileSync(blacklistFile, JSON.stringify([])); // Crée un fichier vide
    console.log('Fichier blacklist.json créé avec une liste vide.');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unbanbot')
        .setDescription('Retirer un serveur de la liste noire.')
        .addStringOption(option => 
            option.setName('server_id')
                .setDescription('L\'ID du serveur à débannir.')
                .setRequired(true)
        ),
    async execute(interaction) {
        const supportServerId = 'ICI'; // Remplace par l'ID de ton serveur support
        const userServerId = interaction.guild.id;

        // Vérifier si la commande est utilisée sur le serveur support
        if (userServerId !== supportServerId) {
            return interaction.reply({ content: 'Cette commande est uniquement disponible sur le serveur support.', ephemeral: true });
        }

        const targetServerId = interaction.options.getString('server_id');

        // Vérifier si le serveur est dans la liste noire
        console.log(`Blacklist actuelle : ${JSON.stringify(blacklist)}`); // Debugging

        if (!blacklist.includes(targetServerId)) {
            return interaction.reply({ content: `Le serveur avec l'ID ${targetServerId} n'est pas dans la liste noire.`, ephemeral: true });
        }

        try {
            // Retirer le serveur de la liste noire
            blacklist = blacklist.filter(id => id !== targetServerId);
            fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 4));

            console.log(`Le serveur ${targetServerId} a été retiré de la blacklist.`); // Debugging
            await interaction.reply(`Le serveur avec l'ID ${targetServerId} a été retiré de la liste noire.`);
        } catch (error) {
            console.error('Erreur lors du retrait de la blacklist :', error);
            await interaction.reply({ content: 'Une erreur s\'est produite lors de la tentative de retirer le serveur de la liste noire.', ephemeral: true });
        }
    },
};
