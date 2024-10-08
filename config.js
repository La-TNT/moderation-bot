const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();  // Assure-toi de charger les variables d'environnement

const mongoURI = process.env.MONGO_URI; // Utilise la variable d'environnement

// Connexion MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure les rôles, questions de vérification, et les logs.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)

        // Subcommand to set member role
        .addSubcommand(subcommand =>
            subcommand
                .setName('member-role')
                .setDescription('Définit le rôle membre à ajouter pour la vérification.')
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Le rôle à assigner aux membres vérifiés.")
                        .setRequired(true)))

        // Subcommand to set restricted role
        .addSubcommand(subcommand =>
            subcommand
                .setName('restricted-role')
                .setDescription('Définit le rôle restreint pour la vérification.')
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Le rôle restreint pour les utilisateurs.")
                        .setRequired(true)))

        // Subcommand to set verification questions
        .addSubcommand(subcommand =>
            subcommand
                .setName('verify-questions')
                .setDescription('Questions à poser lors de la vérification.')
                .addStringOption(option =>
                    option
                        .setName("questions")
                        .setDescription('Liste des questions, séparées par "\\n".')
                        .setRequired(true)))

        // Subcommand to set log channel
        .addSubcommand(subcommand =>
            subcommand
                .setName('log-channel')
                .setDescription('Définit le canal de log des actions mod.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal où les logs de modération seront envoyés.")
                        .setRequired(true)))

        // Subcommand to set verification channel
        .addSubcommand(subcommand =>
            subcommand
                .setName('verification-channel')
                .setDescription('Définit le canal de vérification.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal où les questions de vérification seront posées.")
                        .setRequired(true)))

        // Subcommand to set Halloween leaderboard channel
        .addSubcommand(subcommand =>
            subcommand
                .setName('halloween-leaderboard-channel')
                .setDescription('Définit le canal où le leaderboard d\'Halloween sera affiché.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal pour afficher le leaderboard d\'Halloween.")
                        .setRequired(true)))

        // Subcommand to set Saint Valentin leaderboard channel
        .addSubcommand(subcommand =>
            subcommand
                .setName('valentin-leaderboard-channel')
                .setDescription('Définit le canal où le leaderboard de la Saint-Valentin sera affiché.')
                .addChannelOption(option =>
                    option
                        .setName("channel")
                        .setDescription("Le canal pour afficher le leaderboard de la Saint-Valentin.")
                        .setRequired(true))),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'Cette commande ne peut pas être utilisée en message privé.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const action = interaction.options.getSubcommand();

        try {
            const db = mongoose.connection.db;  // Connexion à la base de données MongoDB

            switch (action) {
                case 'member-role':
                    const memberRole = interaction.options.getRole("role");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { memberRole: memberRole.id } },
                        { upsert: true }  // Si aucun document n'existe, en crée un nouveau
                    );
                    await interaction.editReply({ content: `Rôle des membres vérifiés défini sur \`${memberRole.name}\`.` });
                    break;

                case 'restricted-role':
                    const restrictedRole = interaction.options.getRole("role");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { restrictedRole: restrictedRole.id } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Rôle restreint défini sur \`${restrictedRole.name}\`.` });
                    break;

                case 'verify-questions':
                    const questions = interaction.options.getString("questions");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { verifyQuestions: questions } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Questions de vérification mises à jour.` });
                    break;

                case 'log-channel':
                    const logChannel = interaction.options.getChannel("channel");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { logChannel: logChannel.id } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Canal de log défini sur \`${logChannel.name}\`.` });
                    break;

                case 'verification-channel':
                    const verificationChannel = interaction.options.getChannel("channel");
                    console.log(`Canal de vérification récupéré : ${verificationChannel ? verificationChannel.name : 'Aucun canal trouvé'}`);
                    if (!verificationChannel) {
                        return interaction.editReply({ content: "Aucun canal de vérification trouvé. Veuillez réessayer." });
                    }
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { verificationChannel: verificationChannel.id } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Canal de vérification défini sur \`${verificationChannel.name}\`.` });
                    break;

                case 'halloween-leaderboard-channel':
                    const halloweenChannel = interaction.options.getChannel("channel");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { halloweenLeaderboardChannel: halloweenChannel.id } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Le canal du leaderboard d'Halloween a été défini sur \`${halloweenChannel.name}\`.` });
                    break;

                case 'valentin-leaderboard-channel':
                    const valentinChannel = interaction.options.getChannel("channel");
                    await db.collection('guildConfigs').updateOne(
                        { guildId: interaction.guild.id },
                        { $set: { valentineLeaderboardChannel: valentinChannel.id } },
                        { upsert: true }
                    );
                    await interaction.editReply({ content: `Le canal du leaderboard de la Saint-Valentin a été défini sur \`${valentinChannel.name}\`.` });
                    break;

                default:
                    await interaction.editReply({ content: "Action non reconnue." });
                    break;
            }
        } catch (error) {
            console.error("Erreur de mise à jour de la base de données :", error);
            await interaction.editReply({ content: "Erreur lors de la configuration." });
        }
    },
};
