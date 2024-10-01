const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paque-end')
        .setDescription('Termine l\'événement de Pâques.'),
    async execute(interaction) {
        await db.set('paques_event_active', false);
        await interaction.reply('🐣 L\'événement de Pâques est terminé.');
    }
};
