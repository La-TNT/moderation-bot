module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Connecté en tant que ${client.user.tag} !`);

        // Déployer les commandes globalement
        const commandes = client.commands.map(command => command.data.toJSON());

        try {
            // Déploiement global des commandes
            await client.application.commands.set(commandes);
            console.log('Commandes globales déployées avec succès !');
        } catch (erreur) {
            console.error('Erreur lors du déploiement des commandes globales :', erreur);
        }
    },
};
