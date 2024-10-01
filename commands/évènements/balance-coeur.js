const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance-coeur')
        .setDescription('Affiche le nombre de cœurs que vous possédez.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const heartCurrency = 'coeurs'; // Nom de la monnaie pour la Saint-Valentin

        // Récupérer la quantité actuelle de cœurs pour l'utilisateur
        let userHearts = await db.get(`user_${userId}_${heartCurrency}`) || 0;

        // Répondre avec la balance actuelle
        await interaction.reply({ content: `Vous avez actuellement ${userHearts} cœurs.`, ephemeral: true });
    }
};
