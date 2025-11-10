#!/usr/bin/env node
/**
 * Send IPTV messages - connects to existing WhatsApp session
 */

import { chromium } from 'playwright';

const MESSAGES = [
    {
        name: 'Booba Dieng',
        message: `Salut Booba! 👋

Je vois que ton renouvellement Netflix est demain - parfait timing!

J'ai quelque chose de spécial pour toi en tant que client VIP (toujours à jour, ça c'est du sérieux 💪).

🎯 Nouvelle offre EXCLUSIVE:
Netflix + IPTV Premium = 150,000 GNF/mois

📺 Ce que tu gagnes:
- Tous les matchs (Premier League, Champions League, La Liga)
- 5000+ chaînes (sports, films, séries, news)
- Aucun décodeur, aucune installation
- Juste ton téléphone

🎁 Cadeau: 4h d'essai GRATUIT
Tu choisis quand: Match ce weekend OU série ce soir?

Offre VIP limitée à 20 personnes. Tu es le premier.

Intéressé? Je t'active l'essai maintenant.`
    },
    {
        name: 'Kassory',
        message: `Salut Kassory! 👋

14 jours d'avance sur ton renouvellement - tu es toujours au top, mon ami! 🙏

J'ai pensé à toi pour cette nouvelle offre VIP (clients fidèles seulement):

🎯 IPTV PREMIUM + Netflix
💰 150,000 GNF/mois (tout inclus)

📺 Pourquoi c'est parfait pour toi:
- Tous les matchs en direct (EPL, Champions League)
- Séries et films (Netflix + 5000 chaînes IPTV)
- Aucun équipement (fonctionne sur ton téléphone)
- Support personnel 24/7 par WhatsApp

🎁 Essai GRATUIT 4 heures:
Match ce weekend OU série ce soir - tu choisis.

Seulement 20 places pour clients VIP comme toi.

Tu veux essayer? Je t'active maintenant.`
    },
    {
        name: 'MOHAMED INTER',
        message: `Salut Mohamed! 👋

28 jours d'avance - tu es un client en OR! 💎

Offre EXCLUSIVE pour toi (VIP seulement):

🎯 Netflix + IPTV PREMIUM
150,000 GNF/mois - tout inclus

📺 Ce qui va te plaire:
- TOUS les matchs (Premier League, La Liga, Champions League)
- Pas de décodeur Canal+ (économise 50,000 GNF)
- Fonctionne partout (téléphone, ordinateur, TV)
- 5000+ chaînes (sports, films, news internationales)

🎁 Essai GRATUIT 4h:
Match ce weekend OU série ce soir?

VIP comme toi = priorité. 20 places seulement.

OUI ou NON? Je lance l'essai pour toi maintenant.`
    },
    {
        name: 'Lamine Fofana',
        message: `Salut Lamine! 👋

44 jours d'avance sur ton Netflix - niveau VIP EXCEPTIONNEL! 🏆

Tu mérites cette offre spéciale (clients TOP seulement):

🎯 PACK PREMIUM:
Netflix + IPTV = 150,000 GNF/mois

📺 Pourquoi c'est parfait:
- Tous les matchs en DIRECT (Champions League, EPL, La Liga)
- Plus de 5000 chaînes (sports, films, séries, actualités)
- Zéro installation (ton téléphone suffit)
- Support personnel par WhatsApp

🎁 Cadeau: 4h d'essai GRATUIT
Match ce weekend OU série ce soir - à toi de choisir.

Réservé aux 20 meilleurs clients. Tu es dedans.

Tu veux tester? Je t'active l'accès maintenant.`
    },
    {
        name: 'Esther Amarachi',
        message: `Salut Esther! 👋

45 jours d'avance - cliente EXCEPTIONNELLE! 🌟

J'ai une offre spéciale pour toi (VIP uniquement):

🎯 Netflix + IPTV PREMIUM
💰 150,000 GNF/mois (tout compris)

📺 Ce que tu vas adorer:
- Tous les films et séries (Netflix + 5000 chaînes)
- Contenu africain (Nollywood, local)
- Contenus pour enfants (Disney, Cartoon, etc.)
- Sport en direct pour toute la famille

🎁 Essai GRATUIT 4 heures:
Match ce weekend OU série ce soir?

20 places VIP seulement. Tu es la première.

Intéressée? Je t'active l'essai maintenant.`
    }
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendMessage(page, name, message) {
    console.log(`\n📤 [${name}]`);

    try {
        // Find and click search box
        const searchBox = await page.locator('div[contenteditable="true"][data-tab="3"]').first();
        await searchBox.click();
        await sleep(500);

        // Clear and search
        await page.keyboard.press('Control+A');
        await page.keyboard.type(name);
        await sleep(2500);

        // Click first chat result
        await page.locator('div[data-testid="cell-frame-container"]').first().click();
        await sleep(2000);

        // Find message box and type
        const messageBox = await page.locator('div[contenteditable="true"][data-tab="10"]').first();
        await messageBox.click();
        await sleep(800);

        // Type message with line breaks
        const lines = message.split('\n');
        for (let i = 0; i < lines.length; i++) {
            await page.keyboard.type(lines[i]);
            if (i < lines.length - 1) {
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
            }
        }

        await sleep(1000);

        // Send
        await page.keyboard.press('Enter');
        await sleep(2000);

        console.log(`✅ Sent successfully`);
        return true;

    } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        return false;
    }
}

async function run() {
    console.log('\n🚀 IPTV MESSAGE SENDER\n');

    const context = await chromium.launchPersistentContext('/tmp/zion-whatsapp-profile', {
        headless: false
    });

    const page = context.pages()[0] || await context.newPage();

    console.log('Waiting 3 seconds for WhatsApp to be ready...\n');
    await sleep(3000);

    let sent = 0;

    for (let i = 0; i < MESSAGES.length; i++) {
        const { name, message } = MESSAGES[i];
        console.log(`[${i+1}/${MESSAGES.length}]`);

        const success = await sendMessage(page, name, message);
        if (success) sent++;

        if (i < MESSAGES.length - 1) {
            console.log('\n⏳ Waiting 60s before next message...\n');
            await sleep(60000);
        }
    }

    console.log(`\n\n✅ Complete: ${sent}/${MESSAGES.length} sent\n`);

    await sleep(5000);
    await context.close();
}

run().catch(console.error);
