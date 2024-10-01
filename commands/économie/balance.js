const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Affiche votre solde de rubis.'),
    async execute(interaction) {
        const userId = interaction.user.id;
        let balance = await database.get(`rubis_${userId}`);
        
        if (balance === null) balance = 0;  // Si l'utilisateur n'a pas de rubis, initialiser à 0

        await interaction.reply(`${interaction.user.username}, vous avez ${balance} Rubis.`);
    },
};
