const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveur-liste')
        .setDescription('Affiche la liste des serveurs dans lesquels le bot est présent avec un lien d\'invitation.')
        .setDefaultPermission(true), // Rendre la commande publique
    async execute(interaction) {
        const guilds = interaction.client.guilds.cache;

        if (!guilds.size) {
            return interaction.reply('Le bot n\'est actuellement dans aucun serveur.');
        }

        const embed = new MessageEmbed()
            .setTitle('Liste des serveurs où le bot est présent')
            .setColor('#0099ff');

        const invitePromises = [];

        // Pour chaque serveur, créer un lien d'invitation si le bot a la permission
        guilds.forEach(guild => {
            const invitePromise = guild.invites.create(guild.systemChannel || guild.channels.cache.find(channel => channel.isText()), {
                maxAge: 0, // Lien permanent
                maxUses: 0, // Lien illimité
                unique: true
            }).then(invite => {
                embed.addField(guild.name, invite.url);
            }).catch(err => {
                // En cas d'erreur (par exemple si pas de permission), ne pas afficher d'invitation
                embed.addField(guild.name, 'Pas de lien disponible (permission manquante).');
            });

            invitePromises.push(invitePromise);
        });

        // Attendre que tous les liens d'invitation soient créés
        await Promise.all(invitePromises);

        // Envoyer la réponse une fois que tous les liens sont prêts
        return interaction.reply({ embeds: [embed] });
    }
};
