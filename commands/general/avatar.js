const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("Affiche l'avatar d'un utilisateur")
        .addUserOption(option => 
            option.setName('user')
                .setDescription("L'utilisateur dont vous voulez afficher l'avatar")
                .setRequired(false)
        ),

    async execute(interaction) {
        // Récupérer l'utilisateur fourni ou l'utilisateur qui a exécuté la commande
        const user = interaction.options.getUser('user') || interaction.user;

        // Obtenir les avatars disponibles (normal et animé si présent)
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        // Envoyer un message contenant l'avatar de l'utilisateur
        await interaction.reply({
            content: `Voici l'avatar de **${user.tag}** :`,
            embeds: [{
                color: 0x3498db,
                author: {
                    name: user.tag,
                    icon_url: avatarUrl,
                },
                image: {
                    url: avatarUrl,
                },
                footer: {
                    text: `ID : ${user.id}`,
                }
            }],
        });
    }
};
