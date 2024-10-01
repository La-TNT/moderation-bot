const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paque-participez')
        .setDescription('Participez à l\'événement de Pâques et collectez des œufs.'),
    async execute(interaction) {
        const eventActive = await db.get('paques_event_active');
        if (!eventActive) {
            return interaction.reply({ content: 'L\'événement de Pâques n\'est pas actif pour le moment.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const amount = Math.floor(Math.random() * 20) + 1; // Gagne entre 1 et 20 œufs
        const currentOeufs = await db.get(`paques_${userId}_oeufs`) || 0;
        await db.set(`paques_${userId}_oeufs`, currentOeufs + amount);

        await interaction.reply(`Vous avez gagné ${amount} œufs ! 🥚 Total: ${currentOeufs + amount} œufs.`);
    }
};
