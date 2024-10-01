const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valentin-participez')
        .setDescription('Participez à l’événement de la Saint-Valentin et obtenez des cœurs !'),

    async execute(interaction) {
        // Vérifiez si l'événement est actif
        const isEventActive = await db.get('valentine_event_active');
        if (!isEventActive) {
            return interaction.reply({ content: 'L\'événement de la Saint-Valentin n\'est pas actif pour le moment.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const heartCurrency = 'coeurs'; // Nom de la monnaie pour la Saint-Valentin
        const participationReward = 10; // Nombre de cœurs à attribuer
        const cooldown = 30 * 60 * 1000; // 30 minutes en millisecondes

        // Vérifiez la dernière participation de l'utilisateur
        const lastParticipation = await db.get(`user_${userId}_last_valentine_participation`);
        const currentTime = Date.now();

        if (lastParticipation && (currentTime - lastParticipation) < cooldown) {
            const remainingTime = Math.ceil((cooldown - (currentTime - lastParticipation)) / 60000); // Temps restant en minutes
            return interaction.reply({ content: `Vous devez attendre encore ${remainingTime} minutes avant de pouvoir participer à nouveau.`, ephemeral: true });
        }

        // Récupérer la quantité actuelle de cœurs pour l'utilisateur
        let userHearts = await db.get(`user_${userId}_${heartCurrency}`) || 0;

        // Ajouter les cœurs de récompense
        userHearts += participationReward;
        await db.set(`user_${userId}_${heartCurrency}`, userHearts);

        // Mettre à jour la dernière participation
        await db.set(`user_${userId}_last_valentine_participation`, currentTime);

        await interaction.reply({ content: `Félicitations ! Vous avez obtenu ${participationReward} cœurs. Vous avez maintenant ${userHearts} cœurs.`, ephemeral: true });
    }
};
