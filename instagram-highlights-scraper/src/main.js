// ═══════════════════════════════════════════════════════════════
// main.js  —  Instagram Highlights Scraper
// Actor de Apify — Entry Point
// ═══════════════════════════════════════════════════════════════

import { Actor, log } from 'apify';
import { scrapeHighlightsForUser } from './instagram.js';

await Actor.init();

// ── Leer input
const input = await Actor.getInput() ?? {};

const {
    usernames             = [],
    maxRetries            = 3,
    delayBetweenRequestsMs = 1500,
} = input;

// ── Validar input
if (!Array.isArray(usernames) || usernames.length === 0) {
    throw new Error('Input "usernames" must be a non-empty array of strings.');
}

// ── Limpiar usernames (quitar @, espacios, duplicados)
const cleanUsernames = [
    ...new Set(
        usernames
            .map((u) => String(u).trim().replace(/^@/, '').toLowerCase())
            .filter(Boolean)
    ),
];

log.info(`Starting scrape for ${cleanUsernames.length} account(s): ${cleanUsernames.join(', ')}`);

// ── Dataset de salida
const dataset = await Actor.openDataset();

// ── Contador de resultados
let totalHighlights = 0;
let successAccounts = 0;
let failedAccounts  = 0;

// ── Procesar cada cuenta
for (const username of cleanUsernames) {

    log.info(`━━━ Processing @${username} ━━━`);

    const highlights = await scrapeHighlightsForUser(username, {
        maxRetries,
        delayMs: delayBetweenRequestsMs,
    });

    if (highlights.length > 0) {
        await dataset.pushData(highlights);
        totalHighlights += highlights.length;
        successAccounts++;
        log.info(`@${username}: pushed ${highlights.length} highlight(s) to dataset ✅`);
    } else {
        failedAccounts++;
        log.warning(`@${username}: 0 highlights scraped (private account, no highlights, or rate limited)`);

        // Guardar entrada vacía para que quede registro del intento
        await dataset.pushData([{
            username,
            userId:               null,
            highlightId:          null,
            highlightTitle:       null,
            coverImageUrl:        null,
            coverImageUrlWrapped: null,
            latestReelMedia:      null,
            mediaCount:           null,
            scrapedAt:            new Date().toISOString(),
            error:                'No highlights found or account is private',
        }]);
    }

    // Pausa entre cuentas (excepto la última)
    if (username !== cleanUsernames.at(-1)) {
        log.info(`Waiting ${delayBetweenRequestsMs}ms before next account...`);
        await new Promise((r) => setTimeout(r, delayBetweenRequestsMs));
    }
}

// ── Resumen final
log.info('═══════════════════════════════');
log.info(`✅ Accounts scraped successfully : ${successAccounts}`);
log.info(`❌ Accounts with no results     : ${failedAccounts}`);
log.info(`📦 Total highlights pushed       : ${totalHighlights}`);
log.info('═══════════════════════════════');

await Actor.exit();
