const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const blacklistFilePath = path.join(__dirname, '../../commands/staff/blacklist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banbot')
        .setDescription('Bannir le bot d\'un autre serveur en ajoutant l\'ID du serveur dans la blacklist.')
        .addStringOption(option => 
            option
                .setName('server_id')
                .setDescription('ID du serveur à bannir')
                .setRequired(true)
        ),
    async execute(interaction) {
        const serverId = interaction.options.getString('server_id');
        
        // Charger la blacklist
        let blacklist = [];
        try {
            blacklist = JSON.parse(fs.readFileSync(blacklistFilePath, 'utf8'));
        } catch (error) {
            console.error('Erreur lors de la lecture du fichier blacklist:', error);
        }

        // Ajouter le serveur à la blacklist s'il n'est pas déjà dedans
        if (!blacklist.includes(serverId)) {
            blacklist.push(serverId);
            fs.writeFileSync(blacklistFilePath, JSON.stringify(blacklist, null, 4));
            return interaction.reply(`Le serveur avec l'ID \`${serverId}\` a été ajouté à la blacklist.`);
        } else {
            return interaction.reply(`Le serveur avec l'ID \`${serverId}\` est déjà dans la blacklist.`);
        }
    }
};
