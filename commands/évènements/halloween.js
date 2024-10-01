const { SlashCommandBuilder } = require('discord.js');
const { QuickDB } = require('quick.db');
const db = new QuickDB();
const schedule = require('node-schedule');

const cooldowns = new Map(); // Gestion des cooldowns

// Fonction qui démarre automatiquement l'événement d'Halloween le 31 octobre
function startHalloweenEvent() {
    const today = new Date();
    const isHalloween = today.getDate() === 31 && today.getMonth() === 9; // Mois commence à 0 donc octobre = 9
    if (isHalloween) {
        console.log("🎃 L'événement d'Halloween commence maintenant !");
        // Logique pour démarrer l'événement d'Halloween
    }
}

// Fonction qui arrête l'événement d'Halloween et affiche le leaderboard
async function endHalloweenEvent(client, guildId) {
    console.log("🎃 L'événement d'Halloween est terminé.");
    
    // Récupérer tous les utilisateurs avec des bonbons d'Halloween
    const allUsers = await db.all();
    const halloweenUsers = allUsers.filter(u => u.id.startsWith(`halloween_${guildId}_`)).sort((a, b) => b.value - a.value);
    
    if (halloweenUsers.length === 0) {
        console.log("Aucun utilisateur n'a participé à l'événement.");
        return;
    }

    // Construire le message du leaderboard
    const leaderboard = halloweenUsers.slice(0, 10).map((u, i) => `${i + 1}. <@${u.id.split('_')[2]}>: ${u.value} bonbons`).join('\n');
    const leaderboardMessage = `🎃 **Classement final de l'événement d'Halloween** 🎃\n\n${leaderboard}`;

    // Récupérer le canal de leaderboard configuré pour le serveur
    const leaderboardChannelId = await db.get(`${guildId}.halloweenLeaderboardChannel`);

    if (!leaderboardChannelId) {
        console.log(`Aucun canal de leaderboard n'a été configuré pour le serveur ${guildId}.`);
        return;
    }

    // Envoyer le leaderboard dans le canal configuré
    const channel = client.channels.cache.get(leaderboardChannelId);
    if (channel) {
        channel.send(leaderboardMessage);
    } else {
        console.log(`Le canal avec l'ID ${leaderboardChannelId} n'a pas été trouvé.`);
    }
}

// Planifier l'événement d'Halloween pour commencer et terminer automatiquement
schedule.scheduleJob('0 0 31 10 *', startHalloweenEvent); // Démarre le 31 octobre à minuit
schedule.scheduleJob('59 23 31 10 *', (client, guildId) => endHalloweenEvent(client, guildId));  // Termine à 23h59 le 31 octobre et affiche le leaderboard

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bonbons')
        .setDescription('Voir ou obtenir des bonbons pour Halloween')
        .addSubcommand(subcommand =>
            subcommand
                .setName('obtenir')
                .setDescription('Obtenir des bonbons')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Voir le classement des bonbons')
        ),

    async execute(interaction) {
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const currentMonth = new Date().getMonth(); // Obtenir le mois actuel (0 = janvier, 9 = octobre)
        const now = Date.now();
        const cooldownAmount = 60 * 60 * 1000; // 1 heure en millisecondes

        // Vérifier si nous sommes en octobre
        if (currentMonth !== 9) {
            return interaction.reply({ content: 'L\'événement d\'Halloween n\'est disponible qu\'en octobre.', ephemeral: true });
        }

        if (interaction.options.getSubcommand() === 'obtenir') {
            // Gestion du cooldown
            if (cooldowns.has(userId)) {
                const expirationTime = cooldowns.get(userId) + cooldownAmount;

                if (now < expirationTime) {
                    const timeLeft = (expirationTime - now) / 1000 / 60; // en minutes
                    return interaction.reply({ content: `Vous devez attendre encore ${timeLeft.toFixed(1)} minutes avant de pouvoir collecter plus de bonbons.`, ephemeral: true });
                }
            }

            const amount = Math.floor(Math.random() * 50) + 1; // entre 1 et 50 bonbons
            const currentBonbons = await db.get(`halloween_${guildId}_${userId}_bonbons`) || 0;
            await db.set(`halloween_${guildId}_${userId}_bonbons`, currentBonbons + amount);

            // Ajouter un timestamp pour le cooldown
            cooldowns.set(userId, now);

            await interaction.reply(`Vous avez gagné ${amount} bonbons ! 🎃 Total: ${currentBonbons + amount} bonbons.`);
        } else if (interaction.options.getSubcommand() === 'leaderboard') {
            const allUsers = await db.all();
            const halloweenUsers = allUsers.filter(u => u.id.startsWith(`halloween_${guildId}_`)).sort((a, b) => b.value - a.value);
            const leaderboard = halloweenUsers.slice(0, 10).map((u, i) => `${i + 1}. <@${u.id.split('_')[2]}>: ${u.value} bonbons`).join('\n');
            
            await interaction.reply(`**Classement des bonbons**\n\n${leaderboard}`);
        }
    }
};
