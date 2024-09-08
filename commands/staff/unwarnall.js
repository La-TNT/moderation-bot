const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarnall')
        .setDescription('Retire tous les avertissements d\'un utilisateur.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur dont retirer tous les avertissements')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.editReply('Utilisateur non trouvé dans le serveur.');
        }

        // Récupérer le nombre d'avertissements pour l'utilisateur
        let warnings = await database.get(`${interaction.guild.id}.warnings.${user.id}`) || 0;

        if (warnings === 0) {
            return interaction.editReply('Cet utilisateur n\'a aucun avertissement.');
        }

        // Supprimer tous les avertissements
        await database.delete(`${interaction.guild.id}.warnings.${user.id}`);

        // Log l'action dans le canal de modération
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        if (modChannel) {
            await modChannel.send({
                content: `:white_check_mark: **${interaction.user.tag}** a retiré tous les avertissements de **${user.tag}** (ID: ${user.id}).`
            });
        }

        // Répondre à l'utilisateur
        await interaction.editReply(`Tous les avertissements ont été retirés pour ${user.tag}.`);
    },
};
