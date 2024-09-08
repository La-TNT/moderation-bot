const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Assurez-vous d'avoir un fichier .env pour vos variables d'environnement

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

client.commands = new Collection();

// Charger les commandes
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

// Gestion des interactions Slash
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        // Vérifier si l'interaction est dans un serveur
        if (!interaction.guild) {
            return interaction.reply({ content: 'Cette commande ne peut pas être utilisée en message privé.', ephemeral: true });
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la commande:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
            }
        }
    }
});

// Gestion des messages normaux
client.on(Events.MessageCreate, async message => {
    if (!message.guild) return; // Ignorer les messages privés

    // Ajoutez ici le traitement des messages normaux si nécessaire
});
