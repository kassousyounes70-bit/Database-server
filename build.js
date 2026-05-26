/**
 * NOSTAGAMES - Build Script v2.0
 * يعمل أثناء النشر على Vercel فقط
 * يجلب من Firebase: id, name, ageRating, controls(keys only), description, description_en, iconUrl, downloadUrl
 */

const fs   = require('fs');
const path = require('path');

const FIREBASE_URL = 'https://n-core-nostagames-default-rtdb.firebaseio.com/games.json';
const INDEX_PATH   = path.join(__dirname, 'index.html');

// الألعاب المحظورة (بالـ ID)
const BANNED_IDS = ['meaty_boner_8421'];

/* ── استخراج مفاتيح الأزرار فقط (بدون صور/إحداثيات/حجم) ── */
function extractControlKeys(controlsRaw) {
    if (!controlsRaw || typeof controlsRaw !== 'object') return null;

    const result = { wasd: controlsRaw.wasd === true, p1: [], p2: [] };

    ['p1', 'p2'].forEach(player => {
        const raw = controlsRaw[player];
        if (!raw || typeof raw !== 'object') return;
        // نأخذ المفاتيح فقط — نتجاهل الـ image والإحداثيات
        result[player] = Object.keys(raw).filter(k => k !== ''); // ['JOYSTICK','A','S',...]
    });

    // إذا كلاهما فارغان لا نُرجع controls
    if (result.p1.length === 0 && result.p2.length === 0) return null;
    return result;
}

/* ── جلب الألعاب من Firebase ── */
async function fetchGamesFromFirebase() {
    console.log('🔥 [Build] الاتصال بـ Firebase...');
    try {
        const response = await fetch(FIREBASE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data) { console.warn('⚠️ [Build] قاعدة البيانات فارغة.'); return []; }

        const games = Object.entries(data)
            .filter(([key, game]) =>
                !BANNED_IDS.includes(key) &&           // تخطي المحظورة
                game.downloadUrl &&
                game.downloadUrl.trim() !== ''
            )
            .map(([key, game]) => ({
                id:             key,
                title:          game.name          || 'بدون اسم',
                image:          game.iconUrl        || 'images/icon.png',
                src:            game.downloadUrl,
                type:           game.downloadUrl.toLowerCase().endsWith('.swf') ? 'swf' : 'iframe',
                ageRating:      (game.ageRating     || '+3').replace(/[VB]/g, ''), // تنظيف +16V → +16
                description:    game.description    || '',
                description_en: game.description_en || '',
                categories:     game.categories     || [],
                controls:       extractControlKeys(game.controls)  // مفاتيح فقط
            }));

        console.log(`✅ [Build] تم جلب ${games.length} لعبة.`);
        return games;

    } catch (err) {
        console.error('❌ [Build] خطأ:', err.message);
        return [];
    }
}

/* ── توليد HTML بطاقات الألعاب للـ SEO ── */
function generateGamesGridHTML(games) {
    if (!games.length) return '';
    const ageColors = { '+3':'#2ecc71','+7':'#3498db','+12':'#f39c12','+16':'#e67e22','+18':'#e74c3c' };

    return games.map(g => {
        const color    = ageColors[g.ageRating] || '#2ecc71';
        const desc     = g.description || g.description_en || '';
        const shortDesc = desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
        return `<article class="game-card" data-id="${esc(g.id)}">
  <img src="${esc(g.image)}" alt="${esc(g.title)}" class="card-img" loading="lazy" onerror="this.src='images/icon.png'">
  <span class="age-badge" style="background:${color}">${esc(g.ageRating)}</span>
  <div class="game-title">${esc(g.title)}</div>
  ${shortDesc ? `<p class="card-desc" style="display:none">${esc(shortDesc)}</p>` : ''}
</article>`;
    }).join('\n');
}

/* ── Schema JSON-LD ── */
function generateSchemaLD(games) {
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "ألعاب Flash الكلاسيكية - NostGames",
        "url": "https://nostagames.vercel.app/",
        "numberOfItems": games.length,
        "itemListElement": games.map((g, i) => ({
            "@type": "ListItem", "position": i + 1,
            "item": {
                "@type": "VideoGame",
                "name": g.title,
                "description": g.description || g.description_en || '',
                "image": g.image,
                "contentRating": g.ageRating,
                "genre": (g.categories || []).join(', ') || 'Arcade',
                "gamePlatform": ["Web Browser","Android"],
                "offers": { "@type":"Offer","price":"0","priceCurrency":"USD" },
                "url": `https://nostagames.vercel.app/#game=${g.id}`
            }
        }))
    }, null, 2);
}

/* ── نص مخفي SEO ── */
function generateSeoHidden(games) {
    const items = games.map(g =>
        `<article><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p><p>${esc(g.description_en)}</p></article>`
    ).join('\n');
    return `<div id="seo-hidden-content" aria-hidden="true" style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;">\n${items}\n</div>`;
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

/* ── الوظيفة الرئيسية ── */
async function build() {
    console.log('\n🚀 [Build] NostGames — بدء البناء...\n');

    let html   = fs.readFileSync(INDEX_PATH, 'utf8');
    const games = await fetchGamesFromFirebase();

    // ① حقن window.gamesDatabase (يحتوي controls كـ keys فقط)
    const dbScript = `<script id="server-games-db">
/* ⚡ Static Snapshot — injected at build time */
window.gamesDatabase   = ${JSON.stringify(games)};
window.__serverSnapshot = true;
console.log('[NostGames] snapshot: ${games.length} games');
</script>`;

    // ② Schema JSON-LD
    const schemaScript = `<script type="application/ld+json" id="server-games-schema">
${generateSchemaLD(games)}
</script>`;

    // ③ Grid HTML
    const gridBlock = `<div id="games-grid" class="games-grid">
${generateGamesGridHTML(games)}
<!-- ⚡ build time: ${new Date().toISOString()} | ${games.length} games -->
</div>`;

    // ── تطبيق الحقن ──
    html = html.replace('</head>', `${dbScript}\n${schemaScript}\n</head>`);

    // استبدال games-grid الفارغ أو الممتلئ القديم
    html = html.replace(
        /<div id="games-grid" class="games-grid">[\s\S]*?<\/div>/,
        gridBlock
    );

    html = html.replace('</body>', `${generateSeoHidden(games)}\n</body>`);

    fs.writeFileSync(INDEX_PATH, html, 'utf8');

    console.log(`\n✅ [Build] اكتمل!`);
    console.log(`   📦 الألعاب: ${games.length}`);
    console.log(`   🎮 الألعاب بها أزرار: ${games.filter(g=>g.controls).length}`);
    console.log(`   🔍 Schema + SEO: تم حقنهم\n`);
}

build().catch(err => { console.error('💥 [Build]', err); process.exit(0); });
