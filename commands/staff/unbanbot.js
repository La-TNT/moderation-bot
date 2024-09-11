const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de la blacklist
const blacklistPath = path.resolve(__dirname, '../staff/blacklist.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unbanbot')
        .setDescription('Débannir le bot d\'un serveur')
        .addStringOption(option =>
            option
                .setName('server_id')
                .setDescription('L\'ID du serveur à débannir.')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Vérifier que la commande est exécutée sur le serveur de support
        if (interaction.guild.id !== 'Votre ID serveur discord') {
            return interaction.reply({
                content: 'Cette commande n\'est disponible que sur le serveur de support.',
                ephemeral: true
            });
        }

        // Vérifier si l'utilisateur a les permissions nécessaires (par exemple, administrateur)
        if (!interaction.member.permissions.has('ADMINISTRATOR')) {
            return interaction.reply({
                content: 'Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.',
                ephemeral: true
            });
        }

        // Récupérer l'ID du serveur à débannir
        const serverId = interaction.options.getString('server_id');

        // Charger la liste noire
        let blacklist = [];
        if (fs.existsSync(blacklistPath)) {
            blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'));
        }

        // Vérifier si le serveur est dans la liste noire
        if (!blacklist.includes(serverId)) {
            return interaction.reply({
                content: `Le serveur avec l'ID ${serverId} n'est pas dans la liste noire.`,
                ephemeral: true
            });
        }

        // Supprimer le serveur de la liste noire
        blacklist = blacklist.filter(id => id !== serverId);

        // Sauvegarder la liste noire mise à jour
        fs.writeFileSync(blacklistPath, JSON.stringify(blacklist, null, 2), 'utf-8');

        // Répondre à l'utilisateur
        return interaction.reply({
            content: `Le serveur avec l'ID ${serverId} a été retiré de la liste noire.`,
            ephemeral: true
        });
    }
};
