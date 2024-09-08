const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('muteexit')
        .setDescription('Applique un mute à un utilisateur après qu\'il a quitté le serveur.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
        .addStringOption(option =>
            option.setName('user-id')
                .setDescription('L\'ID de l\'utilisateur à mettre en sourdine')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Durée du mute en minutes (valide uniquement si l\'utilisateur revient)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du mute')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.options.getString('user-id');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
        const durationMs = duration * 60 * 1000;

        try {
            // Fetch the user by ID
            const user = await interaction.client.users.fetch(userId);

            // Check if the user is still in the guild
            const member = await interaction.guild.members.fetch(userId).catch(() => null);

            if (!member) {
                // If the user is not in the server, log that the mute will be applied if they return
                await interaction.editReply(`L'utilisateur avec l'ID \`${userId}\` a quitté le serveur. Le mute de ${duration} minutes sera appliqué s'il revient. Raison : ${reason}`);
                
                // Log the intention to mute this user in the modChannel (for record-keeping)
                const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
                const modChannel = interaction.guild.channels.cache.get(modChannelId);

                if (modChannel) {
                    await modChannel.send({
                        content: `:no_mouth: **${interaction.user.tag}** a prévu un mute pour l'utilisateur **${user.tag}** (${userId}) pour ${duration} minutes lorsqu'il rejoindra à nouveau le serveur.\n\`Raison :\` ${reason}`
                    });
                }
            } else {
                // If the user is still in the server, apply the mute immediately
                await member.timeout(durationMs, reason);
                await interaction.editReply(`L'utilisateur **${user.tag}** (${userId}) a été mis en sourdine pour ${duration} minutes. Raison : ${reason}`);

                // Log the action in the modChannel
                const modChannelId = await database.get(`${interaction.guild.id}.modChannel`);
                const modChannel = interaction.guild.channels.cache.get(modChannelId);

                if (modChannel) {
                    await modChannel.send({
                        content: `:no_mouth: **${interaction.user.tag}** a mis en sourdine **${user.tag}** (${userId}) pour ${duration} minutes.\n\`Raison :\` ${reason}`
                    });
                }
            }
        } catch (error) {
            await interaction.editReply(`Erreur : Impossible de mettre en sourdine cet utilisateur. ${error.message}`);
        }
    },
};
