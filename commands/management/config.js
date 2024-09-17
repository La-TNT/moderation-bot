const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure les rôles, questions de vérification, et les logs.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)

        .addSubcommand(subcommand =>
            subcommand
                .setName('member-role')
                .setDescription('Définit le rôle membre à ajouter pour la vérification.')
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Le rôle à assigner aux membres vérifiés.")
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('restricted-role')
                .setDescription('Définit le rôle restreint pour la vérification.')
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Le rôle restreint pour les utilisateurs.")
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('verify-questions')
                .setDescription('Questions à poser lors de la vérification.')
                .addStringOption(option =>
                    option
                        .setName("questions")
                        .setDescription('Liste des questions, séparées par "\\n".')
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Définit le canal de log des actions mod.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal où les logs de modération seront envoyés.")
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('verification-channel')
                .setDescription('Définit le canal de vérification.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal où les questions de vérification seront posées.")
                        .setRequired(true))),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Cette commande ne peut pas être utilisée en message privé.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const action = interaction.options.getSubcommand();

        switch (action) {
            case 'member-role':
                await database.set(`${interaction.guild.id}.memberRole`, interaction.options.getRole("role").id);
                await interaction.editReply({ content: `Rôle des membres vérifiés défini sur \`${interaction.options.getRole("role").name}\`.` });
                break;

            case 'restricted-role':
                await database.set(`${interaction.guild.id}.restrictedRole`, interaction.options.getRole("role").id);
                await interaction.editReply({ content: `Rôle restreint défini sur \`${interaction.options.getRole("role").name}\`.` });
                break;

            case 'verify-questions':
                await database.set(`${interaction.guild.id}.verifyQuestions`, interaction.options.getString("questions"));
                await interaction.editReply({ content: `Questions de vérification mises à jour.` });
                break;

            case 'log-channel':
                await database.set(`${interaction.guild.id}.logChannel`, interaction.options.getChannel("channel").id);
                await interaction.editReply({ content: `Canal de log défini sur \`${interaction.options.getChannel("channel").name}\`.` });
                break;

            case 'verification-channel':
                await database.set(`${interaction.guild.id}.verificationChannel`, interaction.options.getChannel("channel").id);
                await interaction.editReply({ content: `Canal de vérification défini sur \`${interaction.options.getChannel("channel").name}\`.` });
                break;

            default:
                await interaction.editReply({ content: "Action non reconnue." });
                break;
        }
    },
};
