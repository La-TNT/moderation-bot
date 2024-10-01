const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-rubis')
        .setDescription('Ajouter des rubis à un utilisateur.')
        .addUserOption(option => 
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à qui ajouter des rubis.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Le montant de rubis à ajouter.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),  // Permission requise pour utiliser la commande

    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur');
        const montant = interaction.options.getInteger('montant');

        if (montant <= 0) {
            return interaction.reply({ content: 'Le montant doit être supérieur à 0.', ephemeral: true });
        }

        let balance = await database.get(`rubis_${user.id}`);
        if (balance === null) balance = 0;

        await database.set(`rubis_${user.id}`, balance + montant);
        await interaction.reply(`${montant} Rubis ont été ajoutés à ${user.username}.`);
    },
};
