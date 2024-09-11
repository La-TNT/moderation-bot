const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const axios = require('axios');

// Remplacez ces valeurs par vos propres clés API et ID de moteur
const GOOGLE_API_KEY = 'AIzaSyCzaZH72xpNCwECkqvjJD0KC7l67V2H0H4';
const CUSTOM_SEARCH_ENGINE_ID = '92bbfef2667cc40f9';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recherche')
        .setDescription('Recherche d\'images sur Google.')
        .addStringOption(option => 
            option
                .setName('mot_clé')
                .setDescription('Le mot-clé pour la recherche d\'images.')
                .setRequired(true)
        ),
    async execute(interaction) {
        // Obtenir le mot-clé de la recherche
        const query = interaction.options.getString('mot_clé');

        // Construire l'URL pour l'API Google Custom Search
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${CUSTOM_SEARCH_ENGINE_ID}&key=${GOOGLE_API_KEY}&searchType=image`;

        try {
            // Effectuer la requête API
            const response = await axios.get(url);
            const items = response.data.items;

            // Vérifier s'il y a des résultats
            if (!items || items.length === 0) {
                return interaction.reply('Aucune image trouvée pour ce mot-clé.');
            }

            // Construire le message de réponse
            const embed = new MessageEmbed()
                .setTitle(`Résultats pour "${query}"`)
                .setDescription(`Voici quelques images trouvées pour "${query}" :`)
                .setColor('#0099ff');

            // Ajouter les images trouvées dans l'embed
            items.slice(0, 5).forEach(item => {
                embed.addField(item.title, item.link);
            });

            // Répondre avec l'embed
            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Erreur lors de la recherche d\'images :', error);
            return interaction.reply('Une erreur est survenue lors de la recherche d\'images.');
        }
    }
};
