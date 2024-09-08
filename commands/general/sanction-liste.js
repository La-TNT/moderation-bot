const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("sanction-liste")
        .setDescription("Vérifiez quelqu'un (comme vous-même) pour les sanctions")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("L'utilisateur défini")
                .setRequired(true)
        ),

    async execute(interaction) {

        // Au début, nous différons pour éviter l'échec de l'interaction Discord
        await interaction.deferReply();

        // Définir l'emplacement des sanctions
        const sanctions = await database.get(`${interaction.guild.id}_${interaction.options.getUser("user").id}_punishments`);

        // Si la longueur n'est pas 0, faire ceci
        if (sanctions != null) {

            // Définir warnMessage et le mettre à jour plus tard
            let messageSanctions = `Liste des **${sanctions.length}** sanctions pour l'utilisateur ${interaction.options.getUser("user")}.\n`;

            // Pour chaque avertissement, lister
            sanctions.forEach((item, index) => {
                messageSanctions = messageSanctions + `\`ID de la sanction:\` ${index} \n- \`Type:\` ${item.type}\n- \`Raison:\` ${item.reason} \n- \`Date:\` ${item.date}\n\n`;
            });

            // Répondre avec messageSanctions
            await interaction.editReply({ content: messageSanctions });

        } else {

            // S'il n'y a pas de sanctions, retourner
            await interaction.editReply({ content: `Cet utilisateur n'a aucune sanction.` });
        }
    }
}
