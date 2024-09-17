const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Débannit un utilisateur par son ID.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addStringOption(option =>
            option
                .setName("snowflake")
                .setDescription("L'ID de l'utilisateur à débannir.")
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userID = interaction.options.getString("snowflake");
        const guildID = interaction.guild.id;

        // Vérifier si le canal de modération est configuré
        const modChannelId = await database.get(`${guildID}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        if (!modChannel) {
            return interaction.editReply({
                content: "Données du canal manquantes. Configurez-en un avec `/setdata` !"
            });
        }

        try {
            // Vérifier si l'utilisateur est effectivement banni avant de tenter de le débannir
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(userID);

            if (!bannedUser) {
                return interaction.editReply({
                    content: "Cet utilisateur n'est pas banni ou l'ID est incorrect."
                });
            }

            // Débannir l'utilisateur
            await interaction.guild.bans.remove(userID);

            // Supprimer l'utilisateur de la base de données locale si nécessaire
            const bans = await database.get(`${guildID}_bans`) || [];
            if (bans.some(el => el.user === userID)) {
                await database.pull(`${guildID}_bans`, el => el.user === userID);
            }

            // Enregistrer le débannissement dans le canal de modération
            await modChannel.send({
                content: `:heart: **${interaction.user.tag}** a débanni l'utilisateur avec l'ID : **${userID}**.`
            });

            // Répondre à l'utilisateur que l'action a été réalisée avec succès
            await interaction.editReply({
                content: `L'utilisateur avec l'ID \`${userID}\` a été débanni avec succès.`
            });

        } catch (e) {
            // En cas d'erreur, informer l'utilisateur
            await interaction.editReply({
                content: "Une erreur s'est produite lors de la tentative de débannissement de l'utilisateur. Assurez-vous que l'ID est correct et que l'utilisateur est banni."
            });
        }
    }
};
