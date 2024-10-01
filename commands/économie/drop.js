const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('drop')
        .setDescription('Crée un drop pour une récompense dans un serveur support.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)

        .addStringOption(option => 
            option.setName('titre')
                .setDescription('Le titre du drop')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('La description du drop')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('recompense')
                .setDescription('Le type de récompense (ex: rubis, bonbons, cœurs, œufs)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('montant')
                .setDescription('Le montant de la récompense')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('condition')
                .setDescription('La condition d\'obtention de la récompense (ex: envoyer un message, utiliser une commande)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Le canal où la condition doit être remplie')
                .setRequired(false)),

    async execute(interaction) {
        const supportServerId = '1276577184244563968'; // ID du serveur support
        const userServerId = interaction.guild.id;

        // Vérifie si la commande est utilisée dans le serveur support
        if (userServerId !== supportServerId) {
            return interaction.reply({ content: 'Cette commande est réservée au serveur support.', ephemeral: true });
        }

        // Récupérer les informations du drop
        const titre = interaction.options.getString('titre');
        const description = interaction.options.getString('description');
        const recompense = interaction.options.getString('recompense');
        const montant = interaction.options.getInteger('montant');
        const condition = interaction.options.getString('condition');
        const canal = interaction.options.getChannel('canal');

        // Stocker les informations du drop dans la base de données
        await db.set('current_drop', {
            titre: titre,
            description: description,
            recompense: recompense,
            montant: montant,
            condition: condition,
            canal: canal ? canal.id : null // Enregistrer l'ID du canal ou null
        });

        // Créer l'embed
        const embed = new EmbedBuilder()
            .setTitle(titre)
            .setDescription(description)
            .addFields(
                { name: 'Récompense', value: `${montant} ${recompense}`, inline: true },
                { name: 'Condition', value: condition, inline: true }
            )
            .setColor('#FFA500');

        // Envoyer l'embed avec le bouton
        await interaction.reply({
            embeds: [embed],
            components: [ {
                type: 1,
                components: [
                    {
                        type: 2,
                        label: 'Obtenir la récompense',
                        style: 1,
                        customId: 'obtenir_recompense'
                    }
                ]
            }]
        });

        // Écouter l'interaction avec le bouton "Obtenir la récompense"
        const filter = i => i.customId === 'obtenir_recompense' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            // Vérifier si l'utilisateur a rempli la condition
            let canClaim = false;

            // Condition: envoyer un message dans un canal spécifique
            if (condition.includes('envoyer un message')) {
                if (canal) {
                    const userMessages = await canal.messages.fetch({ limit: 50 });
                    const userHasMessage = userMessages.some(msg => msg.author.id === i.user.id);
                    if (userHasMessage) {
                        canClaim = true;
                    } else {
                        return i.reply({ content: `Vous devez envoyer un message dans <#${canal.id}> pour obtenir la récompense.`, ephemeral: true });
                    }
                }
            }

            // Autre condition possible : Utiliser une commande spécifique
            if (condition.includes('utiliser la commande')) {
                // Exemple : si l'utilisateur a utilisé une certaine commande, vérifiez cela dans une base de données
                const usedCommand = await db.get(`user_${i.user.id}_usedCommand`);
                if (usedCommand) {
                    canClaim = true;
                } else {
                    return i.reply({ content: `Vous devez utiliser la commande spécifiée pour obtenir la récompense.`, ephemeral: true });
                }
            }

            if (canClaim) {
                let key;
                switch(recompense.toLowerCase()) {
                    case 'bonbons':
                        key = `halloween_${userServerId}_${i.user.id}_bonbons`;
                        break;
                    case 'cœurs':
                        key = `valentine_${userServerId}_${i.user.id}_coeurs`;
                        break;
                    case 'rubis':
                        key = `economy_${userServerId}_${i.user.id}_rubis`;
                        break;
                    case 'œufs':
                        key = `easter_${userServerId}_${i.user.id}_oeufs`;
                        break;
                    default:
                        return i.reply({ content: `Type de récompense inconnu.`, ephemeral: true });
                }

                const currentReward = await db.get(key) || 0;
                await db.set(key, currentReward + montant);

                await i.reply(`Félicitations, vous avez obtenu ${montant} ${recompense} ! 🎉`);
            }
        });
    }
};
