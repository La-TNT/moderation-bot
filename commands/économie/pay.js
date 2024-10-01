const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Transférer des rubis à un autre utilisateur.')
        .addUserOption(option => 
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à qui envoyer des rubis.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Le montant de rubis à transférer.')
                .setRequired(true)),

    async execute(interaction) {
        const senderId = interaction.user.id;
        const receiver = interaction.options.getUser('utilisateur');
        const montant = interaction.options.getInteger('montant');

        let senderBalance = await database.get(`rubis_${senderId}`);
        if (senderBalance === null) senderBalance = 0;

        if (senderBalance < montant) {
            return interaction.reply({ content: 'Vous n\'avez pas assez de rubis pour effectuer cette transaction.', ephemeral: true });
        }

        let receiverBalance = await database.get(`rubis_${receiver.id}`);
        if (receiverBalance === null) receiverBalance = 0;

        await database.set(`rubis_${senderId}`, senderBalance - montant);
        await database.set(`rubis_${receiver.id}`, receiverBalance + montant);

        await interaction.reply(`Vous avez transféré ${montant} Rubis à ${receiver.username}.`);
    },
};
