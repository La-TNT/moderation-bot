const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Supprime un nombre spécifié de messages, en ignorant les messages épinglés.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addIntegerOption(option =>
            option
                .setName("amount")
                .setDescription("Combien de messages supprimer")
                .setRequired(true)
        ),
    async execute(interaction) {

        // Au début, nous faisons une réponse différée pour éviter que l'interaction Discord échoue
        await interaction.deferReply({ ephemeral: true });

        // Identifier les messages épinglés
        const pinned = (await interaction.channel.messages.fetch()).filter(msg => !msg.pinned);

        // Récupérer l'ID du canal de log configuré
        const logChannelId = await database.get(`${interaction.guild.id}.logChannel`);
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        // Vérifiez si le canal de log est configuré
        if (!logChannel) {
            return interaction.editReply({ content: "Canal de log non configuré. Utilisez `/config log-channel` pour le configurer." });
        }

        // Définir et supprimer les messages, encapsulé dans un try pour que le code se termine correctement
        let deletedMessages;
        try {
            deletedMessages = await interaction.channel.bulkDelete(pinned.first(interaction.options.getInteger("amount")), true);
        } catch (error) {
            return interaction.editReply({ content: "Erreur lors de la suppression des messages. Assurez-vous de ne pas essayer de supprimer plus de 100 messages à la fois ou des messages plus anciens que 14 jours." });
        }

        // Enregistrer la suppression dans le canal de log
        await logChannel.send({
            content: `:broom: **${interaction.user.tag}** a supprimé **${deletedMessages.size}** messages dans <#${interaction.channel.id}>.`
        });

        // Répondre à l'interaction pour confirmer l'action
        await interaction.editReply({
            content: `Action \`clear chat [${deletedMessages.size} messages]\` appliquée avec succès.`
        });
    }
};
