const { PermissionsBitField } = require("discord.js");
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const ms = require('ms');

// Nombre maximum de mentions autorisées dans un seul message
const maxMentions = 5;

// Paramètres anti-spam
const spamThreshold = 5; // Nombre de messages en un court laps de temps qui est considéré comme du spam
const spamInterval = 7000; // Intervalle de temps en millisecondes (ici 7 secondes)
const spamMuteTime = ms('1m'); // Durée du mute pour spam (ici 1 minute)

// Seuils pour prendre des mesures
const warningThreshold = 3;  // Nombre de violations avant avertissement
const muteThreshold = 5;     // Nombre de violations avant mute
const kickThreshold = 7;     // Nombre de violations avant expulsion
const banThreshold = 10;     // Nombre de violations avant bannissement

// Stockage du spam pour les utilisateurs
const userMessages = new Map();

module.exports = {
    // Fonction à exécuter à chaque message reçu
    async handleMessage(message) {
        // Ignorer les messages envoyés par des bots ou sans contenu
        if (message.author.bot || !message.guild || !message.content) return;

        // Vérifier si l'utilisateur a les permissions de gérer les messages (admin, modérateur)
        if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

        let violations = 0;

        // Importer dynamiquement bad-words avec import()
        const Filter = (await import('bad-words')).default; // Utiliser l'import dynamique

        // Utiliser le filtre
        const filter = new Filter(); // Initialisation du filtre

        // Ajouter des mots interdits supplémentaires si nécessaire
        filter.addWords('insulte1', 'insulte2', 'insulte3'); // Ajoutez des insultes spécifiques

        // Vérifier si le message contient des insultes via le filtre
        const hasBadWords = filter.isProfane(message.content);
        if (hasBadWords) {
            violations++;
            message.reply(`${message.author}, le langage offensant n'est pas autorisé ici.`);
        }

        // Vérifier si l'utilisateur a abusé des mentions
        if (message.mentions.users.size + message.mentions.roles.size > maxMentions) {
            violations++;
            message.reply(`${message.author}, vous avez mentionné trop de personnes dans votre message.`);
        }

        // Gestion du spam
        const now = Date.now();
        if (!userMessages.has(message.author.id)) {
            userMessages.set(message.author.id, []);
        }

        const timestamps = userMessages.get(message.author.id);
        timestamps.push(now);

        // Supprimer les anciens messages hors du délai de spam
        userMessages.set(message.author.id, timestamps.filter(timestamp => now - timestamp < spamInterval));

        if (userMessages.get(message.author.id).length >= spamThreshold) {
            violations++;
            await muteUser(message.member, spamMuteTime);  // Mute temporaire pour spam
            message.reply(`${message.author}, vous avez été temporairement rendu muet pour spam.`);
        }

        // Si des violations sont détectées, gérer les actions
        if (violations > 0) {
            const userViolations = await db.add(`violations_${message.guild.id}_${message.author.id}`, violations);

            if (userViolations >= banThreshold) {
                await message.guild.members.ban(message.author, { reason: 'Trop de violations des règles du serveur.' });
                message.channel.send(`${message.author.tag} a été banni pour avoir enfreint les règles.`);
            } else if (userViolations >= kickThreshold) {
                await message.guild.members.kick(message.author, { reason: 'Trop de violations des règles du serveur.' });
                message.channel.send(`${message.author.tag} a été expulsé pour avoir enfreint les règles.`);
            } else if (userViolations >= muteThreshold) {
                await muteUser(message.member, ms('10m'));  // Mute de 10 minutes
                message.channel.send(`${message.author.tag} a été rendu muet pour 10 minutes.`);
            } else if (userViolations >= warningThreshold) {
                message.channel.send(`${message.author}, vous avez reçu un avertissement. Veuillez respecter les règles.`);
            }
        }
    }
};

// Fonction pour mute un utilisateur en utilisant la méthode timeout()
async function muteUser(member, duration) {
    try {
        // Vérification si l'utilisateur peut être mute
        if (member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            console.log("Cet utilisateur ne peut pas être rendu muet.");
            return;
        }

        // Effectuer le mute
        await member.timeout(duration, "Automodération : violation des règles.");
        console.log(`${member.user.tag} a été réduit au silence pour ${duration / 1000} secondes.`);
    } catch (error) {
        console.error(`Erreur lors du mute de ${member.user.tag}:`, error);
    }
}
