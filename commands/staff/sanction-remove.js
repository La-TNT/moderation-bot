const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("sanction-remove")
        .setDescription("Supprime une punition")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur dont vous souhaitez effacer l'historique")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName("value")
                .setDescription("Valeur de la sanction")
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            if (interaction.user.id === interaction.options.getUser("user").id || interaction.options.getMember("user").permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.editReply("Impossible d'exécuter cette action sur cet utilisateur.");
            }
        } catch (e) {}

        let user = interaction.options.getUser("user");
        const strikes = await database.get(`${interaction.guild.id}_${user.id}_punishments`) || [];

        if (strikes.length === 0) {
            return interaction.editReply({ content: "Cet utilisateur n'a aucune sanction." });
        }

        let modChannel = interaction.guild.channels.cache.get(await database.get(`${interaction.guild.id}.logChannel`));

        if (!modChannel) {
            return interaction.editReply({
                content: "Données du canal manquantes. Configurez-en un avec `/config log-channel` !"
            });
        }

        if (interaction.options.getInteger("value") < 0 || interaction.options.getInteger("value") >= strikes.length) {
            return interaction.editReply({ content: "Échec en raison de : `INVALID_STRIKE_ID`" });
        }

        const modifiedStrikes = await database.pull(`${interaction.guild.id}_${user.id}_punishments`, (_, index) => index === interaction.options.getInteger("value"));

        await modChannel.send({
            content: `:coffee: **${interaction.user.tag}** a effectué l'action : \`nullify\` \n\`Nouvelle quantité de sanctions :\` **${modifiedStrikes.length}**`
        });

        await interaction.editReply({
            content: `Action complétée avec la valeur \`${interaction.options.getInteger("value")}\` sur l'utilisateur ${interaction.options.getUser("user")}.`
        });
    }
};
