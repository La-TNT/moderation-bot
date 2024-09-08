const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ComponentType,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    TextInputStyle,
    ModalBuilder,
    TextInputBuilder,
    PermissionsBitField
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Démarrer le processus de vérification"),

    async execute(interaction) {

        // Configuration de la base de données (membreRole, restrictedRole, gatekeeperChannel, et questions)

        // Définir le rôle de membre tel que défini dans la base de données
        let memberRole = await database.get(`${interaction.guild.id}.memberRole`);

        // Si aucun rôle de membre n'est défini, retourner
        if (memberRole == null) {
            return interaction.reply({
                content: "Aucun rôle de membre défini. Alertez un membre du personnel à ce sujet !",
                ephemeral: true
            });
        }

        // Définir le rôle restreint tel que défini dans la base de données
        let restrictedRole = await database.get(`${interaction.guild.id}.restrictedRole`);

        // Si aucun rôle restreint n'est défini, retourner
        if (restrictedRole == null) {
            return interaction.reply({
                content: "Aucun rôle restreint défini. Alertez un membre du personnel à ce sujet !",
                ephemeral: true
            });
        }

        // Configurer le canal de gatekeeper
        let gatekeeperChannel = interaction.guild.channels.cache.get(await database.get(`${interaction.guild.id}.gatekeeperChannel`));

        // Si le canal de gatekeeper n'existe pas...
        if (gatekeeperChannel == null) {
            return interaction.reply({
                content: "Données de canal manquantes. Alertez un membre du personnel à ce sujet !",
                ephemeral: true
            });
        }

        // Les questions de vérification
        let questions = await database.get(`${interaction.guild.id}.verifyQuestions`);

        // Si les questions de vérification n'existent pas...
        if (questions == null) {
            return interaction.reply({
                content: "Questions de vérification manquantes. Alertez un membre du personnel à ce sujet !",
                ephemeral: true
            });
        }

        // Vérifier si l'utilisateur est déjà vérifié, et si c'est le cas, retourner
        if (interaction.member.roles.cache.has(memberRole)) {
            return interaction.reply({
                content: "Vous êtes déjà vérifié !",
                ephemeral: true
            });
        }

        // Gestion du modal

        // Définir une chaîne aléatoire de lettres et de chiffres pour correspondre à un ID pour la vérification
        let gatewayId = Math.random().toString(36).slice(2);

        // Créer le modal
        const verifyModal = new ModalBuilder()
            .setCustomId(`${gatewayId}`)
            .setTitle(`Passerelle pour ${interaction.guild.name}`);

        // Définir un tableau vide pour le code ci-dessous
        let countVal = 1;

        // Pour chaque question, envoyer une question et obtenir une réponse
        for (const question of questions.split('\\n')) {

            // Créer les composants de saisie de texte
            verifyModal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder()
                .setCustomId(`Question ${countVal}`)
                // L'étiquette est l'invite que l'utilisateur voit pour cette saisie
                .setLabel(question)
                // Short signifie une seule ligne de texte
                .setStyle(TextInputStyle.Short)
            ));

            // Ajouter +1 à countVal pour qu'il s'affiche comme "Question 1, Question 2", etc.
            countVal++;
        }

        // Envoyer le modal à l'utilisateur en cours de vérification
        interaction.showModal(verifyModal);

        // Ajouter un filtre pour la soumission du modal pour éviter d'enregistrer les messages des autres
        const filter = m => m.user.id === interaction.user.id;

        // Attendre qu'ils terminent avec un délai de 2 minutes (120 secondes)
        let modalData = await interaction.awaitModalSubmit({filter, time: 120_000})
            .catch(() => null);

        // Si aucune donnée n'est reçue dans le temps défini ci-dessus, retourner
        if (!modalData) {
            return interaction.channel.send(`Votre vérification a expiré, ${interaction.user}. Veuillez réessayer !`)
                .then(m => setTimeout(() => m.delete(), 5000));
        }

        // Si les données ONT été reçues, continuer et répondre que nous les avons reçues !
        await modalData.reply({
            content: "Vérification reçue. Nous reviendrons vers vous sous peu !",
            ephemeral: true
        });

        // Gestion de l'embed

        // L'URL pour découper la photo de profil Discord
        const merge = "https://images.google.com/searchbyimage?image_url=";

        // Créer un embed vide pour les questions
        const message1 = new EmbedBuilder()
            .setTitle(`Nouvelle vérification reçue !`)
            .setDescription(`[**Recherche d'image inversée d'avatar**](${merge + interaction.user.displayAvatarURL()})`)
            .addFields({
                name: `ID Modal de la Passerelle`,
                value: gatewayId
            })
            .addFields({
                name: `Nom d'utilisateur`,
                value: `<@${interaction.user.id}> - ${interaction.user.tag}`
            })
            // ceci est pour le constructeur d'embed
            .addFields(...modalData.fields.fields.map(
                ({ customId, value }) => ({ name: customId, value })
            ))
            .setThumbnail(interaction.user.displayAvatarURL());

        // Assemblage des boutons

        // Créer les boutons
        const row = new ActionRowBuilder()
            .addComponents(
                // Bouton d'approbation
                new ButtonBuilder()
                    .setCustomId(`approve-${interaction.user.id}`)
                    .setLabel('Approuver')
                    .setStyle(ButtonStyle.Success),

                // Bouton de restriction
                new ButtonBuilder()
                    .setCustomId(`restrict-${interaction.user.id}`)
                    .setLabel('Restreindre')
                    .setStyle(ButtonStyle.Primary),

                // Bouton de refus (Kick)
                new ButtonBuilder()
                    .setCustomId(`decline-${interaction.user.id}`)
                    .setLabel('Refuser')
                    .setStyle(ButtonStyle.Danger),

                // Bouton d'annulation
                new ButtonBuilder()
                    .setCustomId(`cancel-${interaction.user.id}`)
                    .setLabel('Annuler')
                    .setStyle(ButtonStyle.Secondary),
            );

        // Configurer la variable gatekeeperPrompt pour les boutons, envoyer avec succès la vérification et supprimer le message
        const gatekeeperPrompt = await gatekeeperChannel.send({ embeds: [message1], components: [row] });

        // Collecteur de boutons, 7 jours pour répondre
        const buttonCollector = gatekeeperPrompt.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 604800000
        });

        // Gérer les boutons pressés

        // Effectuer une action X sur le bouton Y
        buttonCollector.on('collect', async i => {

            // Pas de permissions ? Sortez d'ici. (Refuser les permissions)
            if (!i.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                await i.deferUpdate();
                return;
            }

            // Approuver un membre
            if (i.customId === `approve-${interaction.user.id}`) {

                // Arrêter d'abord les boutons
                await buttonCollector.stop();

                // Puis supprimer l'embed
                await gatekeeperPrompt.delete();

                try {
                    // Ajouter le rôle de membre
                    await (interaction.member.roles.add(memberRole));

                    // Envoyer un message d'approbation temporaire
                    await gatekeeperChannel.send(`Passerelle \`${gatewayId}\` approuvée avec les paramètres \`aucun\`.`)
                        .then(m => setTimeout(() => m.delete(), 5000));

                    // Enfin, retourner et enregistrer l'action
                    return gatekeeperChannel.send({ content: `:wave: **${i.user.tag}** (*${i.user.id}*) a effectué l'action de passerelle : \`approuver\` \n \`Utilisateur concerné\` : **${interaction.user.tag}** (*${interaction.user.id}*)` });
                } catch (e) {
                    // Il y a un problème - juste annuler
                    return gatekeeperChannel.send(`Échec - Passerelle \`${gatewayId}\` a été fermée.`)
                        .then(m => setTimeout(() => m.delete(), 5000));
                }
            }

            // Restreindre puis approuver
            if (i.customId === `restrict-${interaction.user.id}`) {

                // Arrêter d'abord les boutons
                await buttonCollector.stop();

                // Puis supprimer l'embed
                await gatekeeperPrompt.delete();

                try {
                    // Ajouter un rôle restreint
                    await interaction.member.roles.add(restrictedRole);

                    // Ajouter le rôle de membre
                    await (interaction.member.roles.add(memberRole));

                    // Envoyer un message d'approbation temporaire
                    await gatekeeperChannel.send(`Passerelle \`${gatewayId}\` approuvée avec les paramètres \`restreindre\`.`)
                        .then(m => setTimeout(() => m.delete(), 5000));

                    // Enfin, retourner et enregistrer l'action
                    return gatekeeperChannel.send({ content: `:lock: **${i.user.tag}** (*${i.user.id}*) a effectué l'action de passerelle : \`restreindre et approuver\` \n \`Utilisateur concerné\` : **${interaction.user.tag}** (*${interaction.user.id}*)` });
                } catch (e) {
                    // Il y a un problème - juste annuler
                    return gatekeeperChannel.send(`Échec - Passerelle \`${gatewayId}\` a été fermée.`)
                        .then(m => setTimeout(() => m.delete(), 5000));
                }
            }

            // Refuser le membre
            if (i.customId === `decline-${interaction.user.id}`) {

                // Arrêter d'abord les boutons
                await buttonCollector.stop();

                // Puis supprimer l'embed
                await gatekeeperPrompt.delete();

                try {
                    // Kick l'utilisateur
                    await interaction.member.kick({ reason: `[Argon] Gatekeeper : Refus de la passerelle ${gatewayId}` });

                    // Envoyer un message de refus temporaire
                    await gatekeeperChannel.send(`Passerelle \`${gatewayId}\` refusée.`).then(m => setTimeout(() => m.delete(), 5000));

                    // Enfin, retourner et enregistrer l'action
                    return gatekeeperChannel.send({ content: `:boot: **${i.user.tag}** (*${i.user.id}*) a effectué l'action de passerelle : \`refus\` \n \`Utilisateur concerné\` : **${interaction.user.tag}** (*${interaction.user.id}*)` });
                } catch (e) {
                    // Il y a un problème - juste annuler
                    return gatekeeperChannel.send(`Échec - Passerelle \`${gatewayId}\` a été fermée.`)
                        .then(m => setTimeout(() => m.delete(), 5000));
                }
            }

            // Annuler l'embed
            if (i.customId === `cancel-${interaction.user.id}`) {

                // Arrêter d'abord les boutons
                await buttonCollector.stop();

                // Puis supprimer l'embed
                await gatekeeperPrompt.delete();

                // Enfin, dire qu'il est fermé
                return gatekeeperChannel.send(`Annulé - Passerelle \`${gatewayId}\` a été fermée.`);
            }
        });
    }
}
