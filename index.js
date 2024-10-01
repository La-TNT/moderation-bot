require("dotenv").config();
const fs = require("fs");
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require("discord.js");

// Importez la configuration
const config = require("./config.js");

// Chemin vers le fichier blacklist.json dans commands/staff/blacki
const blacklistFile = path.join(__dirname, 'commands', 'staff', 'blacklist.json');

// Fonction pour lire la liste noire
function getBlacklist() {
    if (!fs.existsSync(blacklistFile)) {
        return [];
    }
    return JSON.parse(fs.readFileSync(blacklistFile, 'utf-8'));
}

// Fonction pour ajouter un serveur à la liste noire
function addToBlacklist(guildId) {
    const blacklist = getBlacklist();
    if (!blacklist.includes(guildId)) {
        blacklist.push(guildId);
        fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));
    }
}

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

// Événement déclenché lorsque le bot rejoint un nouveau serveur
client.on('guildCreate', async (guild) => {
    const blacklist = getBlacklist();

    // Si le serveur est dans la liste noire, quitter immédiatement
    if (blacklist.includes(guild.id)) {
        await guild.leave();
        console.log(`Le bot a quitté le serveur ${guild.name} (ID: ${guild.id}) car il est sur la liste noire.`);
    }
});

// Définir l'activité du bot
client.once('ready', () => {
    client.user.setActivity("Surveille le serveur", { type: "WATCHING" });
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    const event = require('./events/messageCreate.js');
    await event.execute(message);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'obtenir_recompense') {
        const drop = await db.get('current_drop');
        if (!drop) {
            return interaction.reply({ content: 'Aucun drop en cours.', ephemeral: true });
        }

        // Vérifier la condition ici (exemple : vérifier si l'utilisateur a envoyé 100 messages)
        const userMessages = await db.get(`user_${interaction.user.id}_messages`) || 0;
        const conditionMessages = parseInt(drop.condition.match(/\d+/)); // Extrait un nombre de la condition

        if (userMessages >= conditionMessages) {
            // Ajouter la récompense à l'utilisateur
            const userCurrency = await db.get(`user_${interaction.user.id}_${drop.recompense}`) || 0;
            await db.set(`user_${interaction.user.id}_${drop.recompense}`, userCurrency + drop.montant);

            await interaction.reply({ content: `Félicitations ! Vous avez obtenu ${drop.montant} ${drop.recompense}.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `Vous n'avez pas encore rempli la condition pour obtenir la récompense. Condition: ${drop.condition}`, ephemeral: true });
        }
    }
});

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
