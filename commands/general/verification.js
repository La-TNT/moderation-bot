const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verification')
        .setDescription('Utiliser la commande pour vous vérifier.'),

    async execute(interaction) {
        try {
            const verificationChannelId = await database.get(`${interaction.guild.id}.verificationChannel`);
            if (interaction.channel.id !== verificationChannelId) {
                return interaction.reply({ content: 'Cette commande doit être utilisée dans le salon de vérification.', ephemeral: true });
            }

            const verifyRoleId = await database.get(`${interaction.guild.id}.verifyRole`);
            if (!verifyRoleId) {
                return interaction.reply({ content: 'Le rôle de vérification n\'est pas configuré.', ephemeral: true });
            }

            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member.roles.cache.has(verifyRoleId)) {
                return interaction.reply({ content: 'Vous êtes déjà vérifié.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const verifyQuestion = await database.get(`${interaction.guild.id}.verifyQuestions`);
            const logChannelId = await database.get(`${interaction.guild.id}.logChannel`);
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
                const responseText = response.content.toLowerCase();

                await response.delete();

                if (responseText === 'oui') {
                    const verifyRole = interaction.guild.roles.cache.get(verifyRoleId);
                    if (verifyRole) {
                        await member.roles.add(verifyRole);
                        await interaction.editReply(`Vous avez été vérifié et le rôle ${verifyRole.name} vous a été attribué.`);
                    } else {
                        await interaction.editReply('Le rôle de vérification n\'est pas configuré ou n\'existe pas.');
                    }
                } else if (responseText === 'non') {
                    try {
                        // Envoyer un message privé avant d'expulser l'utilisateur
                        try {
                            await member.send(`Vous avez été expulsé du serveur **${interaction.guild.name}** pour la raison suivante : Réponse négative à la vérification.`);
                        } catch (error) {
                            if (error.code === 50007) {
                                console.error('Impossible d\'envoyer un message privé à l’utilisateur expulsé : l\'utilisateur a désactivé les messages privés.');
                            } else {
                                console.error('Erreur inattendue lors de l\'envoi d\'un message privé à l\'utilisateur expulsé :', error);
                            }
                        }

                        // Expulser l'utilisateur
                        await member.kick('Réponse négative à la vérification');
                        await interaction.editReply('Vous avez été expulsé pour avoir répondu non.');
                    } catch (error) {
                        console.error('Erreur lors de l\'expulsion du membre:', error);
                        await interaction.editReply('Une erreur est survenue lors de votre expulsion.');
                    }
                } else {
                    await member.timeout(ms('4d'), 'Réponse invalide à la vérification');
                    await interaction.editReply('Vous avez été mis en mute pendant 4 jours pour avoir donné une réponse invalide.');

                    try {
                        await member.send(`Vous avez été mis en mute sur le serveur **${interaction.guild.name}** pour la raison suivante : Réponse invalide à la vérification. Durée du mute : 4 jours.`);
                    } catch (error) {
                        console.error('Impossible d\'envoyer un message privé à l’utilisateur mis en mute:', error);
                    }

                    if (logChannel) {
                        await logChannel.send({
                            content: `:mute: **${interaction.user.tag}** (ID: ${interaction.user.id}) a été mis en mute pour 4 jours pour avoir donné une réponse invalide.`,
                            embeds: [new EmbedBuilder()
                                .setColor('#e82631')
                                .setTitle('Mute')
                                .setDescription(`Utilisateur : ${interaction.user.tag} (ID: ${interaction.user.id})\nRaison : Réponse invalide à la vérification\nDurée : 4 jours`)
                            ],
                        });
                    }
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
