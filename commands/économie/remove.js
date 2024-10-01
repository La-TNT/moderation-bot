const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Supprime des Rubis, Bonbons, Cœurs ou Œufs d\'un utilisateur.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('rubis')
                .setDescription('Supprime des Rubis d\'un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('L\'utilisateur cible')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('montant')
                        .setDescription('Le nombre de Rubis à supprimer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bonbon')
                .setDescription('Supprime des Bonbons d\'un utilisateur (Halloween)')
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('L\'utilisateur cible')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('montant')
                        .setDescription('Le nombre de Bonbons à supprimer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('coeur')
                .setDescription('Supprime des Cœurs d\'un utilisateur (Saint-Valentin)')
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('L\'utilisateur cible')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('montant')
                        .setDescription('Le nombre de Cœurs à supprimer')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('oeuf')
                .setDescription('Supprime des Œufs d\'un utilisateur (Pâques)')
                .addUserOption(option =>
                    option
                        .setName('utilisateur')
                        .setDescription('L\'utilisateur cible')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName('montant')
                        .setDescription('Le nombre d\'Œufs à supprimer')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur');
        const amount = interaction.options.getInteger('montant');
        const guildId = interaction.guild.id;
        const userId = user.id;

        if (amount <= 0) {
            return interaction.reply({ content: 'Le montant doit être supérieur à 0.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        let currencyKey = '';
        switch (subcommand) {
            case 'rubis':
                currencyKey = `rubis_${userId}`;
                break;
            case 'bonbon':
                currencyKey = `halloween_${guildId}_${userId}_bonbons`;
                break;
            case 'coeur':
                currencyKey = `valentin_${guildId}_${userId}_coeurs`;
                break;
            case 'oeuf':
                currencyKey = `paques_${guildId}_${userId}_oeufs`;
                break;
        }

        const currentBalance = await db.get(currencyKey) || 0;

        if (currentBalance < amount) {
            return interaction.reply({ content: `L'utilisateur n'a pas assez de ${subcommand === 'rubis' ? 'Rubis' : subcommand === 'bonbon' ? 'Bonbons' : subcommand === 'coeur' ? 'Cœurs' : 'Œufs'} pour cette suppression. Actuel: ${currentBalance}.`, ephemeral: true });
        }

        await db.set(currencyKey, currentBalance - amount);

        await interaction.reply({
            content: `${amount} ${subcommand === 'rubis' ? 'Rubis' : subcommand === 'bonbon' ? 'Bonbons' : subcommand === 'coeur' ? 'Cœurs' : 'Œufs'} ont été retirés de l'utilisateur ${user.tag}. Nouveau total: ${currentBalance - amount}.`,
            ephemeral: true
        });
    },
};
