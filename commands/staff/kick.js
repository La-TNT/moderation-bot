const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulse un utilisateur")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur à expulser")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Pourquoi expulsez-vous cet utilisateur ?")
        ),

    async execute(interaction) {

        // Réponse différée pour éviter que l'interaction échoue
        await interaction.deferReply({ ephemeral: true });

        // Récupération des options utilisateur et raison
        const user = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason") || 'Aucune raison spécifiée.';

        // Vérifier si l'utilisateur essaie de se kicker lui-même ou un membre du personnel
        if (interaction.user.id === user.id || (await interaction.guild.members.fetch(user.id)).permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply("Impossible d'exécuter cette action sur cet utilisateur.");
        }

        // Récupérer l'ID du canal de log configuré
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        // Vérifiez si le canal de log est configuré
        if (!modChannel) {
            return interaction.editReply({ content: "Canal de log non configuré. Utilisez `/config log-channel` pour le configurer." });
        }

        // Essayer d'envoyer un message direct à l'utilisateur pour l'informer de son expulsion
        try {
            await user.send({ content: `Vous avez été expulsé de ${interaction.guild.name}\n\`Raison :\` ${reason}` });
        } catch (error) {
            // Si le DM échoue, continuer sans interrompre le processus
        }

        // Expulser réellement l'utilisateur
        try {
            await interaction.guild.members.kick(user, reason);
        } catch (error) {
            return interaction.editReply({ content: `Erreur : Impossible d'expulser cet utilisateur. ${error.message}` });
        }

        // Enregistrer l'expulsion dans le canal de log
        await modChannel.send({
            content: `:boot: **${interaction.user.tag}** a expulsé **${user.tag}** (${user.id})\n\`Raison :\` ${reason}`
        });

        // Enregistrer l'expulsion dans la base de données
        await database.push(`${interaction.guild.id}_${user.id}_punishments`, {
            type: "Kick",
            reason,
            date: new Date()
        });

        // Répondre pour confirmer l'action
        await interaction.editReply({
            content: `Action \`kick user\` réalisée avec succès sur **${user.tag}** (${user.id}).`
        });
    }
};
