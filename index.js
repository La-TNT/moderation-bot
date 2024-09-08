require("dotenv").config();
const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

// Importez la configuration
const config = require("./config.js");

// Créez une instance du client Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// Ajoutez la configuration au client
client.config = config;

// Initialisez la base de données (QuickDB)
const { QuickDB } = require("quick.db");
global.database = new QuickDB();

// Créez une collection pour les commandes
client.commands = new Collection();

// Chargez les commandes
fs.readdirSync("./commands").forEach(folder => {
    const commandFolder = fs.readdirSync(`./commands/${folder}/`).filter(file => file.endsWith(".js"));

    // Gérez chaque commande
    for (const file of commandFolder) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
    }
});

// Chargez les événements
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

// Enregistrez les événements
for (const file of eventFiles) {
    const event = require(`./events/${file}`);

    if (event.once) { // Si l'événement doit être exécuté une seule fois
        client.once(event.name, (...args) => event.execute(...args, client));
    } else { // Si l'événement doit être exécuté plusieurs fois
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Gérez les erreurs non capturées
process.on('uncaughtException', (err) => {
    const errMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
    console.error('Uncaught Exception:', errMsg);
});

process.on('unhandledRejection', (err) => {
    console.error('Uncaught Promise Error:', err);
});

// Connectez le client au bot Discord
client.login(process.env.TOKEN);
