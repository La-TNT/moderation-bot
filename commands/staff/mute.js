const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Réduit un utilisateur au silence")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur à réduire au silence")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("time")
                .setDescription('Durée de la mise en silence. Réglez sur "perm" pour une mise en silence permanente.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Pourquoi faites-vous taire cet utilisateur ?")
        ),

    async execute(interaction) {
        // Réponse différée pour éviter que l'interaction échoue
        await interaction.deferReply({ ephemeral: true });

        // Récupération des options utilisateur, durée et raison
        const user = interaction.options.getUser("user");
        const time = interaction.options.getString("time");
        const reason = interaction.options.getString("reason") || 'Aucune raison spécifiée.';

        // Vérifier si l'utilisateur est encore sur le serveur
        let member;
        try {
            member = await interaction.guild.members.fetch(user.id);
        } catch (error) {
            return interaction.editReply({ content: "L'utilisateur n'est plus présent sur ce serveur." });
        }

        // Vérification si l'utilisateur essaie de se mute lui-même ou mute un membre du personnel
        if (interaction.user.id === user.id || member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply("Impossible d'exécuter cette action sur cet utilisateur.");
        }

        // Récupérer l'ID du canal de log configuré
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        // Vérifiez si le canal de log est configuré
        if (!modChannel) {
            return interaction.editReply({ content: "Canal de log non configuré. Utilisez `/config log-channel` pour le configurer." });
        }

        // Calcul de la durée du mute en millisecondes
        const muteDuration = time === "perm" ? null : ms(time);

        // Essayer d'envoyer un message direct à l'utilisateur pour l'informer de sa mise en silence
        try {
            const durationText = time === "perm" ? "permanente" : time;
            await user.send({ content: `Vous avez été réduit au silence dans ${interaction.guild.name}\n\`Raison :\` ${reason}\n\`Durée :\` ${durationText}` });
        } catch (error) {
            // Si le DM échoue, continuer sans interrompre le processus
        }

        // Enregistrer la mise en silence dans le canal de log
        const durationLog = time === "perm" ? "permanente" : time;
        await modChannel.send({
            content: `:no_mouth: **${interaction.user.tag}** a réduit au silence **${user.tag}** (${user.id})\n\`Durée :\` ${durationLog}\n\`Raison :\` ${reason}`
        });

        // Effectuer réellement la mise en silence de l'utilisateur
        try {
            await member.timeout(muteDuration, reason);
        } catch (error) {
            return interaction.editReply({ content: `Erreur : Impossible de réduire au silence cet utilisateur. ${error.message}` });
        }

        // Répondre pour confirmer l'action
        await interaction.editReply({
            content: `Action \`mute user\` réalisée avec succès sur **${user.tag}** (${user.id}).`
        });
    }
};
