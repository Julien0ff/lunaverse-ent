const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // Fallback to .env
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error("ERREUR: Le token du bot (DISCORD_BOT_TOKEN) est introuvable dans les variables d'environnement.");
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// Configuration des salons
const CHANNELS = {
    PRONOTE: '1487463614335156234',
    RECRUTEMENT: '1420096737145520259'
};

client.once('ready', async () => {
    console.log(`Connecté en tant que ${client.user.tag}`);

    try {
        // ==========================================
        // 1. MESSAGE PRONOTE
        // ==========================================
        const pronoteChannel = await client.channels.fetch(CHANNELS.PRONOTE);
        if (pronoteChannel) {
            console.log("Envoi du message dans le salon Pronote...");

            const pronoteEmbed = new EmbedBuilder()
                .setTitle('🏫 LunaVerse : ENT & Pronote')
                .setDescription("Bienvenue sur les outils numériques de LunaVerse.\n\n📚 **L'E.N.T (Espace Numérique de Travail)**\nVotre espace personnel pour gérer votre dossier, vos candidatures et les annonces de l'académie.\n\n📊 **Pronote**\nLa plateforme de suivi scolaire. Consultez vos notes, votre emploi du temps et vos devoirs en temps réel.")
                .setColor(0x5865F2); // Blurple

            // Image bannière
            const bannerPath = path.join(__dirname, 'banner 2.webp');
            let files = [];
            if (fs.existsSync(bannerPath)) {
                const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'banner.webp' });
                pronoteEmbed.setImage('attachment://banner.webp');
                files.push(bannerAttachment);
            } else {
                console.warn(`Attention: L'image bannière n'a pas été trouvée (${bannerPath}). Le message sera envoyé sans image.`);
            }

            const pronoteRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("Accéder à l'ENT")
                        .setURL('https://ent.lunaverse.fr')
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🌐'),
                    new ButtonBuilder()
                        .setLabel("Accéder à Pronote")
                        .setURL('https://pronote.lunaverse.fr') // Modifie cette URL si besoin
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('📊')
                );

            await pronoteChannel.send({ embeds: [pronoteEmbed], components: [pronoteRow], files });
            console.log("✅ Message Pronote envoyé avec succès.");
        }

        // ==========================================
        // 2. MESSAGE RECRUTEMENT
        // ==========================================
        const recruteChannel = await client.channels.fetch(CHANNELS.RECRUTEMENT);
        if (recruteChannel) {
            console.log("Envoi du message dans le salon Recrutement...");

            const recruteEmbed = new EmbedBuilder()
                .setTitle('🎯 Recrutement LunaVerse')
                .setDescription("L'académie est à la recherche de nouveaux talents !\n\nVous souhaitez rejoindre l'équipe pédagogique (Professeur) ou administrative (AED, Infirmier, Psychologue) ?\nLes candidatures se font exclusivement de manière automatisée via notre **Portail de Recrutement**.\n\n✨ **Comment postuler ?**\n1️⃣ Cliquez sur le bouton ci-dessous.\n2️⃣ Connectez-vous avec votre compte Discord.\n3️⃣ Remplissez le formulaire pour le poste souhaité.\n\nVotre candidature sera examinée dans les plus brefs délais par l'administration !")
                .setColor(0x57F287) // Green

            const recruteRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel("Postuler maintenant")
                        .setURL('https://ent.lunaverse.fr/recrutement')
                        .setStyle(ButtonStyle.Link)
                        .setEmoji('🚀')
                );

            await recruteChannel.send({ embeds: [recruteEmbed], components: [recruteRow] });
            console.log("✅ Message Recrutement envoyé avec succès.");
        }

    } catch (error) {
        console.error("Erreur lors de l'envoi des messages :", error);
    }

    // Déconnexion
    console.log("Déconnexion du bot...");
    client.destroy();
    process.exit(0);
});

client.login(token);
