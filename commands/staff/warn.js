const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const ms = require('ms');  // Assurez-vous que 'ms' est installé avec `npm install ms`

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avertit un utilisateur')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('L’utilisateur à avertir')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison de l’avertissement')),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const user = interaction.options.getUser('user');
        const member = interaction.guild.members.cache.get(user.id);
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée.';

        if (!member) {
            return interaction.editReply('Utilisateur non trouvé dans le serveur.');
        }

        // Récupérer le nombre d’avertissements pour l’utilisateur
        let warnings = await database.get(`${interaction.guild.id}.warnings.${user.id}`) || 0;

        // Ajouter un avertissement
        warnings += 1;
        await database.set(`${interaction.guild.id}.warnings.${user.id}`, warnings);

        // Envoyer un message à l’utilisateur
        try {
            await user.send({
                content: `Vous avez reçu un avertissement sur le serveur ${interaction.guild.name}.\n\`Raison:\` ${reason}\n\`Total des avertissements:\` ${warnings}`
            });
        } catch (error) {
            console.error('Impossible d’envoyer un message à l’utilisateur:', error);
        }

        // Vérifier et appliquer les sanctions en fonction du nombre d’avertissements
        try {
            if (warnings >= 10) {
                // Bannir l'utilisateur après 10 avertissements
                await member.ban({ reason: `Banni pour avoir reçu ${warnings} avertissements` });
                await interaction.editReply(`L’utilisateur ${user.tag} a été banni après ${warnings} avertissements.`);
            } else if (warnings >= 7) {
                // Bannir l'utilisateur pour 7 jours après 7 avertissements
                await member.ban({ days: 7, reason: `Banni pour avoir reçu ${warnings} avertissements` });
                await interaction.editReply(`L’utilisateur ${user.tag} a été banni pour 7 jours après ${warnings} avertissements.`);
            } else if (warnings >= 5) {
                // Appliquer un timeout de 48 heures après 5 avertissements
                await member.timeout(48 * 60 * 60 * 1000, 'Timeout après 5 avertissements');
                await interaction.editReply(`L’utilisateur ${user.tag} a été mis en timeout pour 48 heures après ${warnings} avertissements.`);
            } else if (warnings >= 3) {
                // Appliquer un timeout de 24 heures après 3 avertissements
                await member.timeout(24 * 60 * 60 * 1000, 'Timeout après 3 avertissements');
                await interaction.editReply(`L’utilisateur ${user.tag} a été mis en timeout pour 24 heures après ${warnings} avertissements.`);
            } else {
                // Pas de sanctions appliquées pour moins de 3 avertissements
                await interaction.editReply(`Avertissement envoyé à ${user.tag}. Total des avertissements: ${warnings}`);
            }
        } catch (error) {
            console.error('Erreur lors de l’application de la sanction:', error);
            await interaction.editReply('Impossible d’appliquer la sanction. Vérifiez les permissions du bot.');
        }

        // Log l’action
        const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
        const modChannel = interaction.guild.channels.cache.get(modChannelId);

        if (modChannel) {
            await modChannel.send({
                content: `:warning: **${interaction.user.tag}** a averti **${user.tag}** (ID: ${user.id}).\n\`Raison:\` ${reason}\n\`Total des avertissements:\` ${warnings}`
            });
        } else {
            console.error('Le canal de modération n\'est pas configuré.');
        }
    },
};
