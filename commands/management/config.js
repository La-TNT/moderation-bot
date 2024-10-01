const { SlashCommandBuilder, PermissionsBitField } = require('discord.js'); 
const { QuickDB } = require('quick.db');
const database = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure les rôles, questions de vérification, et les logs.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild) // Disponible uniquement pour les admins

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
                        .setRequired(true)))

        .addSubcommand(subcommand =>
            subcommand
                .setName('halloween-leaderboard-channel')
                .setDescription('Définit le canal où le leaderboard d\'Halloween sera affiché.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal pour afficher le leaderboard d\'Halloween.")
                        .setRequired(true)))

        // Nouvelle sous-commande pour le leaderboard de la Saint-Valentin
        .addSubcommand(subcommand =>
            subcommand
                .setName('valentin-leaderboard-channel')
                .setDescription('Définit le canal où le leaderboard de la Saint-Valentin sera affiché.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal pour afficher le leaderboard de la Saint-Valentin.")
                        .setRequired(true))
        ),

    async execute(interaction) {
        // Vérification si la commande est utilisée dans un serveur
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
                
            case 'halloween-leaderboard-channel':
                const halloweenChannel = interaction.options.getChannel("channel");
                await database.set(`${interaction.guild.id}.halloweenLeaderboardChannel`, halloweenChannel.id);
                await interaction.editReply({ content: `Le canal du leaderboard d'Halloween a été défini sur \`${halloweenChannel.name}\`.` });
                break;

            // Nouvelle gestion pour le canal du leaderboard de la Saint-Valentin
            case 'valentin-leaderboard-channel':
                const valentinChannel = interaction.options.getChannel("channel");
                await database.set(`${interaction.guild.id}.valentineLeaderboardChannel`, valentinChannel.id);
                await interaction.editReply({ content: `Le canal du leaderboard de la Saint-Valentin a été défini sur \`${valentinChannel.name}\`.` });
                break;

            default:
                await interaction.editReply({ content: "Action non reconnue." });
                break;
        }
    },
};
