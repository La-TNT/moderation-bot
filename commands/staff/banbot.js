const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier blacklist.json
const blacklistFile = path.join(__dirname, 'blacklist.json');

// Fonction pour lire la liste noire
function getBlacklist() {
    if (!fs.existsSync(blacklistFile)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(blacklistFile, 'utf-8'));
}

// Fonction pour ajouter un serveur à la liste noire
function addToBlacklist(guildId) {
    const blacklist = getBlacklist();
    if (!blacklist.includes(guildId)) {
        blacklist.push(guildId);
        fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banbot')
        .setDescription('Bannir un bot du serveur et ajouter ce serveur à la liste noire.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option.setName('bot')
                .setDescription('Le bot que vous souhaitez bannir.')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Restreindre la commande au serveur avec l'ID 1276577184244563968
        const allowedGuildId = '1276577184244563968';
        if (interaction.guild.id !== allowedGuildId) {
            return interaction.reply({
                content: "Cette commande n'est disponible que sur le serveur support du bot.",
                ephemeral: true
            });
        }

        // Vérifier si l'utilisateur cible est bien un bot
        const bot = interaction.options.getUser('bot');
        const member = interaction.guild.members.cache.get(bot.id);

        if (!member.user.bot) {
            return interaction.reply({
                content: "L'utilisateur sélectionné n'est pas un bot.",
                ephemeral: true
            });
        }

        // Vérifie si le bot est toujours dans le serveur
        if (!member) {
            return interaction.reply({
                content: 'Ce bot ne fait pas partie de ce serveur.',
                ephemeral: true
            });
        }

        try {
            // Bannir le bot
            await member.ban({ reason: 'Banni par commande /banbot' });

            // Ajouter le serveur à la liste noire
            addToBlacklist(interaction.guild.id);

            return interaction.reply({
                content: `Le bot ${bot.tag} a été banni et ce serveur a été ajouté à la liste noire.`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: "Il y a eu une erreur lors de la tentative de bannissement du bot.",
                ephemeral: true
            });
        }
    }
};
