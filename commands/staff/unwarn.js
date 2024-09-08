const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Retire un avertissement à un utilisateur.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur dont retirer un avertissement')
                .setRequired(true)),

    async execute(interaction) {
        // Débute la réponse différée pour éviter un échec de l'interaction Discord
        await interaction.deferReply({ ephemeral: true });

        // Récupère l'utilisateur et le membre à partir du serveur
        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.editReply('Utilisateur non trouvé dans le serveur.');
        }

        // Récupère le nombre d'avertissements pour l'utilisateur
        let warnings = await database.get(`${interaction.guild.id}.warnings.${user.id}`) || 0;

        if (warnings === 0) {
            return interaction.editReply('Cet utilisateur n\'a aucun avertissement.');
        }

        // Retirer un avertissement
        warnings -= 1;
        await database.set(`${interaction.guild.id}.warnings.${user.id}`, warnings);

        // Vérifie et lève les sanctions si nécessaire
        if (warnings < 3) {
            // Si les avertissements sont inférieurs à 3, retirer les sanctions
            if (member.isCommunicationDisabled()) {
                await member.timeout(null, 'Suppression d\'un avertissement');
            }
            // Le ban n'est pas directement modifiable, il doit être fait séparément si nécessaire
            // await member.ban({ reason: 'Retrait d\'un avertissement' }); // Erreur : Ban ne peut pas être modifié directement comme ça
        }

        // Log l'action dans le canal de modération
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);
        if (modChannel) {
            await modChannel.send({
                content: `:white_check_mark: **${interaction.user.tag}** a retiré un avertissement à **${user.tag}** (ID: ${user.id}).\nTotal des avertissements restants: ${warnings}`
            });
        }

        // Répond à l'utilisateur que l'action a été effectuée avec succès
        await interaction.editReply(`Un avertissement retiré pour ${user.tag}. Total des avertissements restants: ${warnings}`);
    },
};
