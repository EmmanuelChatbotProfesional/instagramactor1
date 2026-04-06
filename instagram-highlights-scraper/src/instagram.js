// ═══════════════════════════════════════════════════════════════
// instagram.js  —  Instagram API helpers
// Usa la API gráfica pública de Instagram (no requiere login
// para cuentas públicas) a través del endpoint /graphql/query
// ═══════════════════════════════════════════════════════════════

import { gotScraping } from 'crawlee';
import { log } from 'apify';

// ── Headers base que imitan un navegador real
const BASE_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) ' +
        'Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language':    'en-US,en;q=0.9',
    'Accept':             '*/*',
    'X-IG-App-ID':        '936619743392459',   // App ID público de Instagram Web
    'X-Requested-With':   'XMLHttpRequest',
    'Sec-Fetch-Site':     'same-origin',
    'Sec-Fetch-Mode':     'cors',
    'Sec-Fetch-Dest':     'empty',
    'Referer':            'https://www.instagram.com/',
    'Origin':             'https://www.instagram.com',
};

// ── Pequeña pausa
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));


// ═══════════════════════════════════════════════════════════════
// 1. Obtener el userId a partir del username
// ═══════════════════════════════════════════════════════════════
export async function getUserId(username) {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

    const res = await gotScraping({
        url,
        headers: BASE_HEADERS,
        responseType: 'json',
        throwHttpErrors: false,
    });

    if (res.statusCode !== 200) {
        throw new Error(`getUserId: HTTP ${res.statusCode} for @${username}`);
    }

    const userId = res.body?.data?.user?.id;
    if (!userId) {
        throw new Error(`getUserId: no userId found for @${username}`);
    }

    log.debug(`@${username} → userId: ${userId}`);
    return userId;
}


// ═══════════════════════════════════════════════════════════════
// 2. Obtener los highlights usando el endpoint de reels/tray
// ═══════════════════════════════════════════════════════════════
export async function getHighlights(userId, username) {
    // Este endpoint devuelve la bandeja de highlights del usuario
    const url = `https://www.instagram.com/api/v1/highlights/${userId}/highlights_tray/`;

    const res = await gotScraping({
        url,
        headers: {
            ...BASE_HEADERS,
            'Referer': `https://www.instagram.com/${username}/`,
        },
        responseType: 'json',
        throwHttpErrors: false,
    });

    if (res.statusCode === 404) {
        log.warning(`@${username}: no highlights found (404)`);
        return [];
    }

    if (res.statusCode !== 200) {
        throw new Error(`getHighlights: HTTP ${res.statusCode} for @${username}`);
    }

    const tray = res.body?.tray;
    if (!Array.isArray(tray)) {
        log.warning(`@${username}: tray is not an array — account may be private or have no highlights`);
        return [];
    }

    log.info(`@${username}: found ${tray.length} highlight(s)`);
    return tray;
}


// ═══════════════════════════════════════════════════════════════
// 3. Parsear cada highlight del tray al formato de salida
// ═══════════════════════════════════════════════════════════════
export function parseHighlight(item, userId, username) {

    const highlightId = item.id ?? '';                       // "highlight:XXXXXXXX"
    const title       = item.title ?? '';
    const coverMedia  = item.cover_media?.cropped_image_version
                     ?? item.cover_media?.image_versions2?.candidates?.[0]
                     ?? null;

    const coverImageUrl = coverMedia?.url ?? '';

    // URL "wrapped" — útil para proxies o re-descarga
    const coverImageUrlWrapped = coverImageUrl
        ? `/api/instagram/get?url=${encodeURIComponent(coverImageUrl)}`
        : '';

    return {
        highlightId,
        highlightTitle:       title,
        userId:               String(userId),
        username,
        coverImageUrl,
        coverImageUrlWrapped,
        // Metadata extra
        latestReelMedia:      item.latest_reel_media     ?? null,
        seenRankedPosition:   item.seen_ranked_position  ?? null,
        mediaCount:           item.media_count            ?? null,
        scrapedAt:            new Date().toISOString(),
    };
}


// ═══════════════════════════════════════════════════════════════
// 4. Función principal: scrapeHighlightsForUser (con reintentos)
// ═══════════════════════════════════════════════════════════════
export async function scrapeHighlightsForUser(username, { maxRetries = 3, delayMs = 1500 } = {}) {

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            log.info(`[${attempt}/${maxRetries}] Scraping @${username}...`);

            // Paso 1 — obtener userId
            const userId = await getUserId(username);
            await sleep(delayMs);

            // Paso 2 — obtener highlights
            const tray = await getHighlights(userId, username);
            await sleep(delayMs);

            // Paso 3 — parsear
            const results = tray.map((item) => parseHighlight(item, userId, username));

            log.info(`@${username}: scraped ${results.length} highlight(s) ✅`);
            return results;

        } catch (err) {
            lastError = err;
            log.warning(`@${username} attempt ${attempt} failed: ${err.message}`);

            if (attempt < maxRetries) {
                const backoff = delayMs * attempt * 2;
                log.info(`Waiting ${backoff}ms before retry...`);
                await sleep(backoff);
            }
        }
    }

    // Si todos los reintentos fallaron
    log.error(`@${username}: all ${maxRetries} attempts failed. Last error: ${lastError?.message}`);
    return [];
}
