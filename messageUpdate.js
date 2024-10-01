const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        // Ignorer les messages non modifiés ou des bots
        if (oldMessage.content === newMessage.content || oldMessage.author.bot) return;

        // Récupérer le canal de log configuré
        const logChannelId = await database.get(`${oldMessage.guild.id}.logChannel`);
        const channel = oldMessage.guild.channels.cache.get(logChannelId);

        // Vérifier si le canal de log est défini
        if (!channel) return;

        // Créer l'embed pour le message modifié
        const cLog = new EmbedBuilder()
            .setColor('#e8a726')
            .setTitle('Message Modifié')
            .setDescription(`**De :** || ${oldMessage.content.trim() === '' ? '<media>' : oldMessage.content} || \n **À :** || ${newMessage.content} ||`);

        // Ajouter les pièces jointes à l'embed
        const urls = [...oldMessage.attachments.values()];
        for (const url of urls) {
            cLog.addFields({ name: 'Pièces jointes', value: url.proxyURL });
        }

        // Envoyer l'embed dans le canal de log
        await channel.send({
            content: `:warning: **${oldMessage.author.tag}** *(${oldMessage.author.id})* a modifié un message dans ${oldMessage.channel}:`,
            embeds: [cLog],
        });
    },
};
