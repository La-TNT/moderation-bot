const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveur-liste')
        .setDescription('Liste les serveurs où le bot est présent avec des liens d\'invitation.'),
    async execute(interaction) {
        const supportServerId = '1276577184244563968'; // Remplace par l'ID de ton serveur support
        if (interaction.guild.id !== supportServerId) {
            return interaction.reply({ content: 'Cette commande est uniquement disponible sur le serveur support.', ephemeral: true });
        }

        let serverList = '';

        for (const [guildId, guild] of interaction.client.guilds.cache) {
            try {
                // Debug : Vérifier les permissions du bot sur le serveur
                console.log(`Vérification des permissions pour le serveur: ${guild.name} (ID: ${guildId})`);

                // Vérifier si le bot a les permissions pour créer une invitation
                const channel = guild.channels.cache.find(channel =>
                    channel.isTextBased() && channel.permissionsFor(guild.members.me).has(['CREATE_INSTANT_INVITE', 'VIEW_CHANNEL'])
                );

                if (!channel) {
                    console.log(`Aucun canal approprié trouvé sur ${guild.name}. Vérifiez les permissions.`);
                    serverList += `**${guild.name}** (ID: ${guildId}) - Impossible de trouver un canal avec les permissions nécessaires.\n`;
                    continue;
                }

                // Essayer de créer un lien d'invitation
                const invite = await channel.createInvite({ maxAge: 0, maxUses: 1 });
                serverList += `**${guild.name}** (ID: ${guildId}) - [Lien d'invitation](${invite.url})\n`;

            } catch (error) {
                // Si la création du lien échoue
                console.error(`Erreur lors de la création d'un lien d'invitation pour ${guild.name} (${guildId}):`, error);
                serverList += `**${guild.name}** (ID: ${guildId}) - Impossible de créer un lien d'invitation.\n`;
            }
        }

        if (serverList === '') {
            serverList = 'Le bot n\'est présent sur aucun serveur.';
        }

        return interaction.reply({ content: serverList, ephemeral: true });
    },
};