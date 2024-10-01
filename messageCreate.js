const autoMod = require('../helpers/automod.js'); // Mettre à jour le chemin ici

module.exports = {
    name: "messageCreate",
    
    async execute(message) {
        // Appel du système Auto-Mod pour chaque message reçu
        await autoMod.handleMessage(message);
    }
};
