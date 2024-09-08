const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");
const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bannit un utilisateur du serveur")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur à bannir")
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName("time")
                .setDescription('Durée du bannissement. Utilisez "perm" pour un bannissement permanent.')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName("reason")
                .setDescription("Raison du bannissement")),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser("user");
        const time = interaction.options.getString("time");
        const reason = interaction.options.getString("reason") || 'Aucune raison spécifiée.';
        const logChannelId = await database.get(`${interaction.guild.id}.logChannel`);  // Utilisation du nouveau canal de log
        const logChannel = interaction.guild.channels.cache.get(logChannelId);

        // Vérifiez si le canal de log existe
        if (!logChannel) {
            return interaction.editReply({ content: "Canal de log non défini. Utilisez `/config log-channel` pour le configurer." });
        }

        // Vérifiez si l'utilisateur essaie de se bannir lui-même ou un membre du personnel
        if (user.id === interaction.user.id || (await interaction.guild.members.fetch(user.id)).permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.editReply("Vous ne pouvez pas vous bannir ou bannir un membre du personnel.");
        }

        // Traitez les bannissements non permanents
        let banEnd;
        let durationMessage;

        if (time !== "perm") {
            banEnd = Date.now() + ms(time);
            await database.push(`${interaction.guild.id}_bans`, {
                user: user.id,
                end: banEnd
            });
            durationMessage = `Durée: ${time}`;
        } else {
            durationMessage = "Durée: Permanent";
        }

        // Essayez de DM l'utilisateur au sujet du bannissement
        try {
            await user.send(`Vous avez été banni de ${interaction.guild.name}\n\`${durationMessage}\`\n\`Raison:\` ${reason}`);
        } catch {
            // Ignorer les erreurs si le DM échoue
        }

        // Effectuez le bannissement
        try {
            await interaction.guild.members.ban(user.id, { days: 7, reason });
        } catch (error) {
            return interaction.editReply({ content: `Échec du bannissement : ${error.message}` });
        }

        // Enregistrez le bannissement dans le canal de log
        await logChannel.send({
            content: `:hammer: **${interaction.user.tag}** a banni **${user.tag}** (${user.id})\n\`${durationMessage}\`\n\`Raison:\` ${reason}`
        });

        // Enregistrez le bannissement dans la base de données
        await database.push(`${interaction.guild.id}_${user.id}_punishments`, {
            type: "Ban",
            reason,
            date: new Date(),
            duration: durationMessage
        });

        // Confirmez l'action
        await interaction.editReply({
            content: `Bannissement réussi de **${user.tag}** (${user.id})`
        });
    }
};
