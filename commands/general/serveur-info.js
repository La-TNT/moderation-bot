const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveur-info')
        .setDescription('Obtenir les informations d\'un serveur à partir d\'un lien d\'invitation ou de son ID.')
        .addStringOption(option =>
            option
                .setName('lien_invitation')
                .setDescription('Le lien d\'invitation du serveur.')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('id_serveur')
                .setDescription('L\'ID du serveur.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const inviteLink = interaction.options.getString('lien_invitation');
        const serverId = interaction.options.getString('id_serveur');

        if (!inviteLink && !serverId) {
            return interaction.reply({
                content: 'Veuillez fournir un lien d\'invitation ou un ID de serveur.',
                ephemeral: true
            });
        }

        let serverInfo;

        try {
            // Si un lien d'invitation est fourni, obtenir les informations via l'invitation
            if (inviteLink) {
                const inviteCode = inviteLink.split('/').pop();
                const inviteData = await interaction.client.fetchInvite(inviteCode);
                serverInfo = inviteData.guild;
            }
            // Si un ID de serveur est fourni, obtenir les informations directement
            else if (serverId) {
                serverInfo = await interaction.client.guilds.fetch(serverId);
            }

            if (serverInfo) {
                // Récupérer les salons du serveur
                const channels = serverInfo.channels.cache.filter(channel => channel.type === 'GUILD_TEXT');
                const channelNames = channels.map(channel => channel.name).join(', ') || 'Aucun salon trouvé.';

                // Vérifier s'il y a des salons NSFW
                const nsfwChannels = channels.filter(channel => channel.nsfw);

                // Construire l'embed de réponse avec les informations de base du serveur
                const embed = new MessageEmbed()
                    .setTitle(`Informations sur le serveur : ${serverInfo.name}`)
                    .setDescription(serverInfo.description || 'Pas de description disponible.')
                    .addField('ID du serveur', serverInfo.id, true)
                    .addField('Fondateur', `<@${serverInfo.ownerId}>`, true)
                    .addField('Date de création', `<t:${Math.floor(serverInfo.createdTimestamp / 1000)}:F>`, true)
                    .addField('Nombre de salons', `${channels.size}`, true)
                    .addField('Salons NSFW', nsfwChannels.size > 0 ? 'Oui (18+)' : 'Non', true)
                    .addField('Salons', channelNames || 'Aucun', false)
                    .setThumbnail(serverInfo.iconURL({ dynamic: true, size: 512 }) || null)
                    .setColor('#0099ff');

                if (serverInfo.bannerURL()) {
                    embed.setImage(serverInfo.bannerURL({ size: 1024 }));
                }

                // Si des salons NSFW existent, récupérer les dernières images publiées
                if (nsfwChannels.size > 0) {
                    for (const [channelId, channel] of nsfwChannels) {
                        const messages = await channel.messages.fetch({ limit: 10 });
                        const imageMessages = messages.filter(msg => msg.attachments.size > 0);

                        if (imageMessages.size > 0) {
                            const nsfwEmbed = new MessageEmbed()
                                .setTitle(`Images publiées dans le salon NSFW : #${channel.name}`)
                                .setColor('#ff0000');

                            imageMessages.forEach(msg => {
                                const attachment = msg.attachments.first();
                                if (attachment && attachment.contentType.startsWith('image/')) {
                                    nsfwEmbed.setImage(attachment.url);
                                }
                            });

                            // Répondre avec les images NSFW
                            await interaction.followUp({ embeds: [nsfwEmbed] });
                        }
                    }
                }

                // Répondre avec l'embed principal
                return interaction.reply({ embeds: [embed] });

            } else {
                return interaction.reply({
                    content: 'Impossible de trouver des informations sur ce serveur.',
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error('Erreur lors de la récupération des informations du serveur :', error);
            return interaction.reply({
                content: 'Une erreur est survenue lors de la récupération des informations du serveur.',
                ephemeral: true
            });
        }
    }
};
