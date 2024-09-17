const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Lève le silence d'un utilisateur.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur à dé-silencier.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Pourquoi dé-silenciez-vous cet utilisateur ?")
                .setRequired(false)
        ),

    async execute(interaction) {
        // Débute la réponse différée pour éviter un échec de l'interaction Discord
        await interaction.deferReply({ ephemeral: true });

        const userToUnmute = interaction.options.getMember("user");
        const reason = interaction.options.getString("reason") || 'Aucune raison spécifiée.';

        // Vérifie si l'utilisateur essaie de se dé-silencier lui-même ou un autre utilisateur avec des permissions élevées
        if (interaction.user.id === userToUnmute.id || userToUnmute.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply("Impossible de lever le silence de cet utilisateur.");
        }

        // Récupère le canal de modération configuré
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        // Vérifie si le canal de modération est configuré
        if (!modChannel) {
            return interaction.editReply({
                content: "Données de canal manquantes. Configurez-en un avec `/setdata` !"
            });
        }

        try {
            // Lève le silence de l'utilisateur en réinitialisant la durée du timeout à null
            await userToUnmute.timeout(null, reason);

            // Enregistre l'action dans le canal de modération
            await modChannel.send({
                content: `:speaking_head: **${interaction.user.tag}** a levé le silence de **${userToUnmute.user.tag}** *(${userToUnmute.user.id})* \n\`Raison :\` ${reason}`
            });

            // Répond que l'action a été réalisée avec succès
            await interaction.editReply({
                content: `Le silence de **${userToUnmute.user.tag}** a été levé avec succès.`
            });

        } catch (error) {
            // Gère les erreurs, comme le cas où l'utilisateur n'est pas en silence
            await interaction.editReply({
                content: "Erreur : Impossible de lever le silence de cet utilisateur. Il est peut-être déjà dé-silencié."
            });
        }
    }
};
