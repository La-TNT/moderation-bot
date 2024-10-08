const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Utiliser la commande pour vous vérifier.'),

    async execute(interaction) {
        try {
            const db = mongoose.connection.db;  // Connexion à la base de données MongoDB

            // Récupérer la configuration
            const settings = await db.collection('guildConfigs').findOne({ guildId: interaction.guild.id });
            if (!settings) {
                return interaction.reply({ content: 'Les paramètres du serveur ne sont pas configurés.', ephemeral: true });
            }

            const verificationChannelId = settings.verificationChannel;
            if (interaction.channel.id !== verificationChannelId) {
                return interaction.reply({ content: 'Cette commande doit être utilisée dans le salon de vérification.', ephemeral: true });
            }

            const verifyRoleId = settings.memberRole;
            if (!verifyRoleId) {
                return interaction.reply({ content: 'Le rôle de vérification n\'est pas configuré.', ephemeral: true });
            }

            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member.roles.cache.has(verifyRoleId)) {
                return interaction.reply({ content: 'Vous êtes déjà vérifié.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const verifyQuestion = settings.verifyQuestions;
            const logChannelId = settings.logChannel;
            const logChannel = interaction.guild.channels.cache.get(logChannelId);

            await interaction.editReply({ content: `:question: **Question de vérification :** ${verifyQuestion}` });

            const filter = response => response.author.id === interaction.user.id;
            const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
                .catch(() => {
                    handleInvalidResponse(interaction, 'Aucune réponse reçue. Vous avez été mis en mute pour 4 jours.', 4, logChannel);
                    return interaction.followUp({ content: 'Aucune réponse reçue. Vous avez été mis en mute pour 4 jours.', ephemeral: true });
                });

            if (collected && collected.size > 0) {
                const response = collected.first();
                const responseText = response.content.trim().toLowerCase();

                await response.delete();

                const verifyRole = interaction.guild.roles.cache.get(verifyRoleId);
                if (responseText === 'oui' && verifyRole) {
                    await member.roles.add(verifyRole);
                    await interaction.editReply(`Vous avez été vérifié et le rôle ${verifyRole.name} vous a été attribué.`);
                } else if (responseText === 'non') {
                    await member.kick('Réponse négative à la vérification');
                    await interaction.editReply('Vous avez été expulsé pour avoir répondu non.');
                } else {
                    await member.timeout(ms('4d'), 'Réponse invalide à la vérification');
                    await interaction.editReply('Vous avez été mis en mute pendant 4 jours pour avoir donné une réponse invalide.');
                }
            }
        } catch (error) {
            console.error('Erreur durant la vérification :', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Une erreur est survenue durant la vérification.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Une erreur est survenue durant la vérification.', ephemeral: true });
            }
        }
    },
};

async function handleInvalidResponse(interaction, reason, durationDays, logChannel) {
    const member = interaction.guild.members.cache.get(interaction.user.id);

    if (member) {
        await member.timeout(ms(`${durationDays}d`), reason);
        try {
            await member.send(`Vous avez été mis en mute sur le serveur **${interaction.guild.name}** pour la raison suivante : ${reason}. Durée du mute : ${durationDays} jours.`);
        } catch (error) {
            console.error('Impossible d\'envoyer un message privé à l’utilisateur mis en mute:', error);
        }
    }

    if (logChannel) {
        await logChannel.send({
            content: `:mute: **${interaction.user.tag}** (ID: ${interaction.user.id}) a été mis en mute pour ${durationDays} jours pour avoir donné une réponse invalide.`,
            embeds: [new EmbedBuilder()
                .setColor('#e82631')
                .setTitle('Mute')
                .setDescription(`Utilisateur : ${interaction.user.tag} (ID: ${interaction.user.id})\nRaison : Réponse invalide à la vérification\nDurée : ${durationDays} jours`)
            ],
        });
    }
}
