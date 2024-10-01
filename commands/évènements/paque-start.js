const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paque-start')
        .setDescription('Commence l\'événement de Pâques.'),
    async execute(interaction) {
        await db.set('paques_event_active', true);
        await interaction.reply('🥚 L\'événement de Pâques a commencé !');
    }
};
