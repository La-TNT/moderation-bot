const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valentin-end')
        .setDescription('Termine l\'événement de la Saint-Valentin et envoie le leaderboard.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(interaction) {
        const isEventActive = await db.get('valentine_event_active');

        if (!isEventActive) {
            return interaction.reply({ content: "Aucun événement de la Saint-Valentin n'est en cours.", ephemeral: true });
        }

        // Fin de l'événement
        await db.set('valentine_event_active', false);
        await interaction.reply("🎉 L'événement de la Saint-Valentin est terminé. Merci à tous pour votre participation !");

        // Récupérer le canal du leaderboard défini
        const leaderboardChannelId = await db.get(`${interaction.guild.id}.valentineLeaderboardChannel`);
        if (!leaderboardChannelId) {
            return interaction.followUp({ content: "Le canal du leaderboard n'a pas été défini.", ephemeral: true });
        }

        const leaderboardChannel = interaction.guild.channels.cache.get(leaderboardChannelId);
        if (!leaderboardChannel) {
            return interaction.followUp({ content: "Impossible de trouver le canal du leaderboard.", ephemeral: true });
        }

        // Récupérer tous les utilisateurs ayant des cœurs
        const usersData = await db.all();
        const valentineUsers = usersData
            .filter(entry => entry.id.includes('_coeurs')) // Filtrer les utilisateurs qui ont des cœurs
            .map(entry => ({
                userId: entry.id.split('_')[1], // Extraire l'ID utilisateur depuis la clé
                hearts: entry.value // Nombre de cœurs
            }))
            .sort((a, b) => b.hearts - a.hearts); // Trier par nombre de cœurs décroissant

        // Créer l'embed du leaderboard
        const embed = new EmbedBuilder()
            .setTitle("Leaderboard de la Saint-Valentin")
            .setDescription("Voici le classement des utilisateurs ayant obtenu le plus de cœurs durant l'événement :")
            .setColor(0xFF69B4) // Couleur rose pour le thème de la Saint-Valentin
            .setTimestamp();

        // Ajouter les utilisateurs et leurs scores à l'embed
        if (valentineUsers.length === 0) {
            embed.addFields({ name: "Pas de participants", value: "Aucun utilisateur n'a participé à cet événement." });
        } else {
            valentineUsers.slice(0, 10).forEach((user, index) => {
                embed.addFields({ name: `#${index + 1} - <@${user.userId}>`, value: `${user.hearts} cœurs`, inline: true });
            });
        }

        // Envoyer l'embed dans le canal du leaderboard
        await leaderboardChannel.send({ embeds: [embed] });
    },
};
