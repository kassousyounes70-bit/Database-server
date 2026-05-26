/**
 * NOSTAGAMES - Build Script v2.1 (ESM)
 * يعمل أثناء النشر على Vercel فقط
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIREBASE_URL = 'https://n-core-nostagames-default-rtdb.firebaseio.com/games.json';
const INDEX_PATH   = path.join(__dirname, 'index.html');
const BANNED_IDS   = ['meaty_boner_8421'];

function extractControlKeys(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const result = { wasd: raw.wasd === true, p1: [] };
    const p1 = raw.p1;
    if (p1 && typeof p1 === 'object' && !Array.isArray(p1)) {
        result.p1 = Object.keys(p1).filter(k => k.trim() !== '');
    }
    if (result.p1.length === 0 && !result.wasd) return null;
    return result;
}

async function fetchGames() {
    console.log('🔥 [Build] الاتصال بـ Firebase...');
    try {
        const res  = await fetch(FIREBASE_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data) return [];

        const games = Object.entries(data)
            .filter(([key, g]) => !BANNED_IDS.includes(key) && g.downloadUrl?.trim())
            .map(([key, g]) => ({
                id:             key,
                title:          g.name          || 'بدون اسم',
                image:          g.iconUrl        || 'images/icon.png',
                src:            g.downloadUrl,
                type:           g.downloadUrl.toLowerCase().endsWith('.swf') ? 'swf' : 'iframe',
                ageRating:      (g.ageRating     || '+3').replace(/[VB]/g, ''),
                description:    g.description    || '',
                description_en: g.description_en || '',
                categories:     g.categories     || [],
                controls:       extractControlKeys(g.controls)
            }));

        console.log(`✅ [Build] ${games.length} لعبة — بها أزرار: ${games.filter(g=>g.controls).length}`);
        return games;
    } catch (e) {
        console.error('❌ [Build] خطأ Firebase:', e.message);
        return [];
    }
}

function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function buildGrid(games) {
    const colors = {'+3':'#2ecc71','+7':'#3498db','+12':'#f39c12','+16':'#e67e22','+18':'#e74c3c'};
    return games.map(g => {
        const c    = colors[g.ageRating] || '#2ecc71';
        const desc = (g.description || g.description_en || '').slice(0, 100);
        return `<article class="game-card" data-id="${esc(g.id)}">
  <img src="${esc(g.image)}" alt="${esc(g.title)}" class="card-img" loading="lazy" onerror="this.src='images/icon.png'">
  <span class="age-badge" style="background:${c}">${esc(g.ageRating)}</span>
  <div class="game-title">${esc(g.title)}</div>
  ${desc ? `<p class="card-desc" style="display:none">${esc(desc)}</p>` : ''}
</article>`;
    }).join('\n');
}

function buildSchema(games) {
    return JSON.stringify({
        "@context":"https://schema.org","@type":"ItemList",
        "name":"ألعاب Flash الكلاسيكية - NostGames",
        "url":"https://nostagames.vercel.app/",
        "numberOfItems": games.length,
        "itemListElement": games.map((g,i)=>({
            "@type":"ListItem","position":i+1,
            "item":{
                "@type":"VideoGame","name":g.title,
                "description":g.description||g.description_en||'',
                "image":g.image,"contentRating":g.ageRating,
                "gamePlatform":["Web Browser","Android"],
                "offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
                "url":`https://nostagames.vercel.app/#game=${g.id}`
            }
        }))
    }, null, 2);
}

function buildSeoHidden(games) {
    return `<div id="seo-hidden-content" aria-hidden="true" style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;">
${games.map(g=>`<article><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><p>${esc(g.description_en)}</p></article>`).join('\n')}
</div>`;
}

async function build() {
    console.log('\n🚀 [Build] NostGames بدء البناء...\n');
    let html   = fs.readFileSync(INDEX_PATH, 'utf8');
    const games = await fetchGames();

    // ① window.gamesDatabase
    html = html.replace('</head>', `<script id="server-games-db">
window.gamesDatabase    = ${JSON.stringify(games)};
window.__serverSnapshot = true;
console.log('[NostGames] snapshot: ${games.length} games');
</script>
<script type="application/ld+json" id="server-games-schema">
${buildSchema(games)}
</script>
</head>`);

    // ② games-grid
    const gridBlock = `<div id="games-grid" class="games-grid">
${buildGrid(games)}
<!-- build: ${new Date().toISOString()} | ${games.length} games -->
</div>`;
    html = html.replace(/<div id="games-grid" class="games-grid">[\s\S]*?<\/div>/, gridBlock);

    // ③ SEO hidden
    html = html.replace('</body>', `${buildSeoHidden(games)}\n</body>`);

    fs.writeFileSync(INDEX_PATH, html, 'utf8');
    console.log(`\n✅ [Build] اكتمل! الألعاب: ${games.length}\n`);
}

build().catch(e => { console.error('💥', e); process.exit(0); });
