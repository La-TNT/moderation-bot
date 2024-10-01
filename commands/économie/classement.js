const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('classement')
        .setDescription('Affiche le classement des utilisateurs avec le plus de rubis.'),

    async execute(interaction) {
        const allUsers = await database.all();  // Récupère toutes les données de la base
        const rubisData = allUsers
            .filter(entry => entry.id.startsWith('rubis_'))  // Ne garde que les entrées concernant les rubis
            .map(entry => ({
                userId: entry.id.split('_')[1],  // Récupère l'ID de l'utilisateur
                rubis: entry.value,  // Récupère le nombre de rubis
            }))
            .sort((a, b) => b.rubis - a.rubis)  // Trie par nombre de rubis décroissant
            .slice(0, 10);  // Limite aux 10 meilleurs

        if (rubisData.length === 0) {
            return interaction.reply({ content: 'Il n\'y a pas encore de classement disponible.', ephemeral: true });
        }

        let leaderboard = '🏆 **Classement des utilisateurs avec le plus de rubis :**\n\n';
        rubisData.forEach((entry, index) => {
            const user = interaction.guild.members.cache.get(entry.userId);
            leaderboard += `**${index + 1}.** ${user ? user.user.tag : 'Utilisateur inconnu'} - **${entry.rubis} Rubis**\n`;
        });

        await interaction.reply({ content: leaderboard });
    },
};
