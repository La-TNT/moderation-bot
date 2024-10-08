const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'guildCreate',
    once: false,
    async execute(guild) {
        const blacklistPath = path.join(__dirname, '../commands/staff/blacklist.json');

        try {
            const blacklistData = fs.readFileSync(blacklistPath, 'utf8');
            const blacklist = JSON.parse(blacklistData);

            if (blacklist.includes(guild.id)) {
                // Si le serveur est sur la liste noire, expulsez le bot
                await guild.members.me.kick('Retiré pour blacklist');
                console.log(`Bot expulsé du serveur ${guild.name} car il est dans la liste noire.`);
            }
        } catch (error) {
            console.error('Erreur lors de la gestion de l\'entrée du bot dans un serveur :', error);
        }
    }
};
