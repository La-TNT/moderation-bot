const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('valentin-start')
        .setDescription('Démarre l\'événement de la Saint-Valentin.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Le canal où envoyer l\'annonce de l\'événement.')
                .setRequired(true)),

    async execute(interaction) {
        const isEventActive = await db.get('valentine_event_active');

        if (isEventActive) {
            return interaction.reply({ content: "L'événement de la Saint-Valentin est déjà en cours.", ephemeral: true });
        }

        await db.set('valentine_event_active', true);
        await interaction.reply("🎉 L'événement de la Saint-Valentin a commencé ! Les utilisateurs peuvent désormais participer avec `/valentin-participez`.");

        const canal = interaction.options.getChannel('canal');

        const embed = new EmbedBuilder()
            .setTitle("Événement de la Saint-Valentin")
            .setDescription("Participez à notre événement spécial de la Saint-Valentin et gagnez des récompenses romantiques ! Utilisez `/valentin-participez` pour rejoindre l'événement.")
            .setColor(0xFF69B4) // Couleur rose pour le thème de la Saint-Valentin
            .setTimestamp();

        await canal.send({ embeds: [embed] });
    }
};
