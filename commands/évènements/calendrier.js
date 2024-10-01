const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calendrier_noel')
        .setDescription('Ouvre une case du calendrier de Noël et gagne des Rubis !'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const today = new Date().getDate();  // Obtenir le jour actuel du mois
        const currentMonth = new Date().getMonth();  // Obtenir le mois actuel (0 = janvier, 11 = décembre)

        // Vérifier si le mois est décembre (11)
        if (currentMonth !== 11) {
            return interaction.reply({ content: 'Le calendrier de Noël n\'est disponible qu\'en décembre.', ephemeral: true });
        }

        const lastOpened = await db.get(`calendrier_noel_${userId}_last_opened`);
        
        // Vérifie si l'utilisateur a déjà ouvert une case aujourd'hui
        if (lastOpened === today) {
            return interaction.reply({ content: 'Tu as déjà ouvert une case aujourd\'hui. Reviens demain pour en ouvrir une autre !', ephemeral: true });
        }

        // Attribuer des rubis aléatoires (ex : entre 5 et 20 rubis)
        const rubisGagnes = Math.floor(Math.random() * 16) + 5;

        // Ajoute les rubis à l'utilisateur
        const currentRubis = await db.get(`rubis_${userId}`) || 0;
        await db.set(`rubis_${userId}`, currentRubis + rubisGagnes);

        // Enregistrer la dernière case ouverte
        await db.set(`calendrier_noel_${userId}_last_opened`, today);

        // Réponse au joueur
        await interaction.reply({
            content: `🎄 Joyeux Noël ! Tu as gagné **${rubisGagnes} Rubis** en ouvrant la case du jour !`,
            ephemeral: true
        });
    },
};
