const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('aide')
        .setDescription('Affiche une liste des commandes disponibles et leurs descriptions.')
        .addStringOption(option =>
            option.setName('commande')
                .setDescription('Afficher les détails pour une commande spécifique.')
                .setRequired(false)),

    async execute(interaction) {
        const subCommand = interaction.options.getString('commande');

        if (subCommand) {
            // Afficher des détails pour une commande spécifique
            switch (subCommand.toLowerCase()) {
                case 'config':
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle('Commande /config')
                                .setDescription('Configure les rôles, les questions de vérification, et les canaux de logs.')
                                .addFields(
                                    { name: '/config member-role', value: 'Définit le rôle membre à ajouter pour la vérification.' },
                                    { name: '/config restricted-role', value: 'Définit le rôle restreint pour les utilisateurs.' },
                                    { name: '/config verify-questions', value: 'Définit les questions à poser lors de la vérification.' },
                                    { name: '/config log-channel', value: 'Définit le canal de log des actions mod.' },
                                    { name: '/config verification-channel', value: 'Définit le canal où les utilisateurs doivent répondre à la vérification.' }
                                )
                        ],
                        ephemeral: true
                    });
                    break;

                case 'verification':
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#0099ff')
                                .setTitle('Commande /verification')
                                .setDescription('Utilisez cette commande pour vérifier un utilisateur en répondant à une question posée dans le canal de vérification.')
                                .addFields(
                                    { name: '/verification', value: 'Vérifie un utilisateur en posant une question.' }
                                )
                        ],
                        ephemeral: true
                    });
                    break;

                // Ajoutez d'autres commandes spécifiques ici si nécessaire

                default:
                    await interaction.reply({ content: 'Commande spécifique non reconnue.', ephemeral: true });
                    break;
            }
        } else {
            // Afficher toutes les commandes disponibles
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Liste des Commandes')
                        .setDescription('Voici une liste des commandes disponibles sur ce serveur :')
                        .addFields(
                            { name: '/config', value: 'Configure les rôles, questions de vérification, et les logs.' },
                            { name: '/warn', value: 'Ajoute un avertissement à un utilisateur. Après 10 avertissements, l\'utilisateur est banni.' },
                            { name: '/unwarn', value: 'Supprime un avertissement d\'un utilisateur.' },
                            { name: '/unwarnall', value: 'Supprime tous les avertissements d\'un utilisateur.' },
                            { name: '/banexit', value: 'Bannit un utilisateur qui a quitté le serveur avec une durée spécifiée.' },
                            { name: '/muteexit', value: 'Mute un utilisateur qui a quitté le serveur avec une durée spécifiée.' },
                            { name: '/unmute', value: 'Retire le mute d\'un utilisateur.' },
                            { name: '/ban', value: 'Bannit un utilisateur du serveur.' },
                            { name: '/kick', value: 'Expulse un utilisateur.' },
                            { name: '/clear', value: 'Supprime un nombre spécifié de messages, en ignorant les messages épinglés.' },
                            { name: '/start', value: 'Démarrer le processus de vérification.' },
                            { name: '/verification', value: 'Utilisez cette commande pour vous vérifier.' },
                            { name: '/banbot', value: 'Ban le bot d un serveur.' },
                            { name: '/aide', value: 'Affiche cette liste des commandes disponibles.' }
                        )
                        .setFooter({ text: 'Utilisez /aide <commande> pour plus de détails sur une commande spécifique.' })
                ],
                ephemeral: true
            });
        }
    },
};
