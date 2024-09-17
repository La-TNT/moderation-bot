const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

const googleApiKey = 'AIzaSyCzaZH72xpNCwECkqvjJD0KC7l67V2H0H4'; // Votre clé API Google
const searchEngineId = '92bbfef2667cc40f9'; // Votre ID de moteur de recherche

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recherche')
        .setDescription('Recherche des images sur le web.')
        .addStringOption(option => 
            option.setName('mot_cle')
                .setDescription('Le mot clé de recherche.')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('afficher_liens')
                .setDescription('Voulez-vous afficher les liens des images ? (oui/non)')
                .setRequired(true)
                .addChoices(
                    { name: 'oui', value: 'oui' },
                    { name: 'non', value: 'non' },
                )),
    async execute(interaction) {
        const motCle = interaction.options.getString('mot_cle');
        const afficherLiens = interaction.options.getString('afficher_liens') === 'oui';

        try {
            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: googleApiKey,
                    cx: searchEngineId,
                    q: motCle,
                    searchType: 'image',
                    num: 3, // Nombre d'images à afficher
                },
            });

            const items = response.data.items;

            if (!items || items.length === 0) {
                return interaction.reply({ content: 'Aucune image trouvée pour cette recherche.', ephemeral: true });
            }

            // Crée un tableau pour accumuler les messages à envoyer
            let messages = [];

            items.forEach((item, index) => {
                if (afficherLiens) {
                    // Ajoute les liens au tableau de messages
                    messages.push(`Image ${index + 1}: ${item.link}`);
                } else {
                    // Ajoute les images (URLs directes) au tableau de messages
                    messages.push(`Image ${index + 1}:`);
                    messages.push(item.link);
                }
            });

            // Envoie tous les messages en une seule réponse
            await interaction.reply(messages.join('\n'));

        } catch (error) {
            console.error('Erreur lors de la recherche d\'images :', error);
            await interaction.reply({ content: 'Une erreur s\'est produite lors de la recherche d\'images.', ephemeral: true });
        }
    },
};