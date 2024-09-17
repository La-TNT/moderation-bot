const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveur-info')
        .setDescription('Affiche les informations sur un serveur spécifique.')
        .addStringOption(option => 
            option.setName('server_input')
                .setDescription('ID du serveur ou lien d\'invitation')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const input = interaction.options.getString('server_input');
            let guildInfo = null;
            let isBotInGuild = false;

            // Vérifier si l'entrée est un lien d'invitation
            if (input.match(/https:\/\/discord\.gg\/.+/)) {
                // Utiliser l'API pour récupérer les informations à partir du lien d'invitation
                try {
                    const invite = await interaction.client.fetchInvite(input);
                    guildInfo = invite.guild;
                } catch (error) {
                    console.error('Erreur lors de la récupération des informations du lien d\'invitation :', error);
                    return interaction.reply({ content: 'Impossible de récupérer les informations du serveur via le lien d\'invitation.', ephemeral: true });
                }
            } else {
                // Sinon, supposer que c'est un ID de serveur et vérifier si le bot y est présent
                const guild = interaction.client.guilds.cache.get(input);
                if (guild) {
                    guildInfo = guild;
                    isBotInGuild = true;
                } else {
                    return interaction.reply({ content: 'Le bot n\'est pas présent sur le serveur spécifié et le lien d\'invitation est invalide.', ephemeral: true });
                }
            }

            if (!guildInfo) {
                return interaction.reply({ content: 'Impossible de trouver des informations sur ce serveur.', ephemeral: true });
            }

            // Récupérer les informations de base du serveur
            const serverName = guildInfo.name;
            const serverId = guildInfo.id;
            const iconURL = guildInfo.iconURL({ dynamic: true });

            // Commencer à construire la réponse
            let serverInfo = `**Nom du serveur :** ${serverName}\n`;
            serverInfo += `**ID du serveur :** ${serverId}\n`;

            // Inclure l'icône du serveur
            if (iconURL) {
                serverInfo += `**Icône du serveur :** [Lien de l'icône](${iconURL})\n`;
            }

            if (isBotInGuild) {
                // Si le bot est dans le serveur, ajouter des détails supplémentaires
                const memberCount = guildInfo.memberCount;
                const textChannels = guildInfo.channels.cache.filter(channel => channel.isTextBased());
                const voiceChannels = guildInfo.channels.cache.filter(channel => channel.isVoiceBased());
                const nsfwChannels = textChannels.filter(channel => channel.nsfw);

                serverInfo += `**Nombre de membres :** ${memberCount}\n`;
                serverInfo += `**Nombre de salons textuels :** ${textChannels.size}\n`;
                serverInfo += `**Nombre de salons vocaux :** ${voiceChannels.size}\n`;
                serverInfo += `**Nombre de salons NSFW :** ${nsfwChannels.size}\n`;

                // Inclure les images des salons NSFW si disponibles
                let nsfwImages = '';
                if (nsfwChannels.size > 0) {
                    for (const channel of nsfwChannels.values()) {
                        // Récupérer quelques messages du salon pour essayer de trouver une image
                        const messages = await channel.messages.fetch({ limit: 10 });
                        const imageMessage = messages.find(msg => msg.attachments.size > 0 && msg.attachments.first().contentType.startsWith('image/'));

                        if (imageMessage) {
                            const imageUrl = imageMessage.attachments.first().url;
                            nsfwImages += `\nImage trouvée dans #${channel.name}: [Voir l'image](${imageUrl})`;
                        }
                    }
                }

                if (nsfwImages) {
                    serverInfo += `**Images des salons NSFW :** ${nsfwImages}`;
                }
            } else {
                // Si le bot n'est pas dans le serveur, seulement des infos de base sont affichées
                serverInfo += `Le bot n'est pas présent dans ce serveur, donc des détails supplémentaires ne peuvent pas être affichés.`;
            }

            await interaction.reply({ content: serverInfo, ephemeral: true });
        } catch (error) {
            console.error('Erreur lors de la récupération des informations du serveur :', error);
            return interaction.reply({ content: 'Une erreur s\'est produite lors de la récupération des informations du serveur.', ephemeral: true });
        }
    },
};