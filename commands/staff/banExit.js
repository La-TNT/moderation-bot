const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banexit')
        .setDescription('Bannit un utilisateur qui a quitté le serveur.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addStringOption(option =>
            option.setName('user-id')
                .setDescription('L\'ID de l\'utilisateur à bannir')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Durée du bannissement en jours (laisser vide pour un bannissement permanent)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du bannissement')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.options.getString('user-id');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';

        // Récupérer l'ID du canal de log configuré
        const logChannelId = await database.get(`${interaction.guild.id}.logChannel`);
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        try {
            // Bannir l'utilisateur
            await interaction.guild.members.ban(userId, { reason, days: duration || 0 });

            const durationMessage = duration ? `${duration} jours` : 'de façon permanente';

            // Message de confirmation à l'utilisateur qui a exécuté la commande
            await interaction.editReply(`L'utilisateur avec l'ID \`${userId}\` a été banni pour ${durationMessage} pour la raison suivante : ${reason}`);

            // Si le canal de log est configuré, envoyer un message dans ce canal
            if (logChannel) {
                await logChannel.send(`:hammer: **${interaction.user.tag}** a banni l'utilisateur avec l'ID \`${userId}\`\n\`Durée:\` ${durationMessage}\n\`Raison:\` ${reason}`);
            }

        } catch (error) {
            await interaction.editReply('Erreur : Impossible de bannir cet utilisateur. Vérifiez l\'ID et assurez-vous que l\'utilisateur n\'est pas déjà banni.');
        }
    },
};
