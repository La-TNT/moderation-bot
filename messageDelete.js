const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        // Ignorer les messages des bots
        if (message.author.bot) return;

        // Récupérer le canal de log configuré
        const logChannelId = await database.get(`${message.guild.id}.logChannel`);
        const channel = message.guild.channels.cache.get(logChannelId);

        // Vérifier si le canal de log est défini
        if (!channel) return;

        // Créer l'embed pour le message supprimé
        const cLog = new EmbedBuilder()
            .setColor('#e82631')
            .setTitle('Message Supprimé')
            .setDescription(`|| ${message.content.trim() === '' ? '<media>' : message.content} ||`);

        // Ajouter les pièces jointes à l'embed
        const urls = [...message.attachments.values()];
        for (const url of urls) {
            cLog.addFields({ name: 'Pièces jointes', value: url.proxyURL });
        }

        // Envoyer l'embed dans le canal de log
        await channel.send({
            content: `:x: **${message.author.tag}** *(${message.author.id})* a supprimé un message dans ${message.channel}:`,
            embeds: [cLog],
        });
    },
};
