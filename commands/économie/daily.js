const { SlashCommandBuilder } = require('discord.js');
const ms = require('ms');  // Utilisation d'un package pour gérer le temps

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Réclamez votre récompense quotidienne de rubis.'),

    async execute(interaction) {
        const userId = interaction.user.id;
        const dailyReward = 20;
        const cooldown = 24 * 60 * 60 * 1000;  // 24 heures en millisecondes

        // Récupérer le dernier temps où l'utilisateur a utilisé la commande
        let lastClaimed = await database.get(`lastClaimed_${userId}`);

        // Vérifier si l'utilisateur est en période de cooldown
        if (lastClaimed !== null && Date.now() - lastClaimed < cooldown) {
            const remainingTime = cooldown - (Date.now() - lastClaimed);
            const timeString = ms(remainingTime, { long: true });
            return interaction.reply({ content: `Vous avez déjà réclamé vos rubis aujourd'hui. Revenez dans ${timeString}.`, ephemeral: true });
        }

        // Ajouter la récompense à son solde
        let balance = await database.get(`rubis_${userId}`);
        if (balance === null) balance = 0;

        await database.set(`rubis_${userId}`, balance + dailyReward);
        await database.set(`lastClaimed_${userId}`, Date.now());  // Mettre à jour la dernière réclamation

        await interaction.reply(`${interaction.user.username}, vous avez réclamé votre récompense quotidienne de ${dailyReward} Rubis !`);
    },
};
