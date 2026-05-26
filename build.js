/**
 * NOSTAGAMES - Build Script (Pre-render Engine)
 * يعمل أثناء النشر على Vercel فقط
 * المهمة: جلب الألعاب من Firebase وحقنها في index.html كـ Static Snapshot
 */

const fs = require('fs');
const path = require('path');

const FIREBASE_URL = 'https://n-core-nostagames-default-rtdb.firebaseio.com/games.json';
const INDEX_PATH = path.join(__dirname, 'index.html');

// ===== دالة تجريد أزرار التحكم =====
function cleanControls(rawControls) {
    if (!rawControls) return null;
    const cleaned = { p1: {}, wasd: !!rawControls.wasd };
    if (rawControls.p1) {
        for (const key in rawControls.p1) {
            // نحتفظ باسم الزر فقط دون الإحداثيات أو الأحجام أو الصور
            cleaned.p1[key] = {}; 
        }
    }
    return cleaned;
}

// ===== الاتصال بـ Firebase =====
async function fetchGamesFromFirebase() {
    console.log('🔥 [Build] جاري الاتصال بـ Firebase...');
    
    try {
        const response = await fetch(FIREBASE_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        if (!data) {
            console.warn('⚠️ [Build] لا توجد بيانات في Firebase، سيتم المتابعة بدون snapshot.');
            return [];
        }
        
        // تصفية الألعاب الصالحة وتجاوز اللعبة المحجوبة
        const games = Object.entries(data)
            .filter(([key, game]) => key !== 'ban_01' && game.downloadUrl && game.downloadUrl.trim() !== '')
            .map(([key, game]) => ({
                id: key,
                title: game.name || 'بدون اسم',
                image: game.iconUrl || 'images/icon.png',
                src: game.downloadUrl,
                ageRating: game.ageRating || '+3',
                type: game.downloadUrl.toLowerCase().endsWith('.swf') ? 'swf' : 'iframe',
                description: game.description || '',
                description_en: game.description_en || '',
                categories: game.categories || [],
                controls: cleanControls(game.controls) // إضافة بيانات التحكم المجردة
            }));
        
        console.log(`✅ [Build] تم جلب ${games.length} لعبة من Firebase.`);
        return games;
        
    } catch (error) {
        console.error('❌ [Build] خطأ في الاتصال بـ Firebase:', error.message);
        console.warn('⚠️ [Build] سيتم المتابعة بدون snapshot — الموقع سيعمل لكن بدون SEO مسبق.');
        return [];
    }
}

// ===== توليد HTML لبطاقات الألعاب =====
function generateGamesGridHTML(games) {
    if (!games.length) return '';
    
    const ageColors = {
        '+3': '#2ecc71',
        '+7': '#3498db',
        '+12': '#f39c12',
        '+16': '#e67e22',
        '+18': '#e74c3c'
    };
    
    const cards = games.map(game => {
        const color = ageColors[game.ageRating] || '#2ecc71';
        const desc = game.description || game.description_en || '';
        const shortDesc = desc.length > 80 ? desc.substring(0, 77) + '...' : desc;
        
        return `<article class="game-card" data-id="${escapeHtml(game.id)}" data-src="${escapeHtml(game.src)}" data-type="${escapeHtml(game.type)}">
  <div class="card-img-wrapper">
    <img src="${escapeHtml(game.image)}" alt="${escapeHtml(game.title)}" class="card-img" loading="lazy" onerror="this.src='images/icon.png'">
    <span class="age-badge" style="background:${color}">${escapeHtml(game.ageRating)}</span>
  </div>
  <div class="card-body">
    <h3 class="card-title">${escapeHtml(game.title)}</h3>
    ${shortDesc ? `<p class="card-desc">${escapeHtml(shortDesc)}</p>` : ''}
    <button class="pixel-btn play-btn" data-id="${escapeHtml(game.id)}" aria-label="العب ${escapeHtml(game.title)}">
      <i class="fa-solid fa-play"></i> العب الآن
    </button>
  </div>
</article>`;
    }).join('\n');
    
    return cards;
}

// ===== توليد Schema JSON-LD للـ SEO =====
function generateSchemaLD(games) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "ألعاب Flash الكلاسيكية - NostGames",
        "description": "أفضل ألعاب Flash الكلاسيكية للأندرويد مجاناً",
        "url": "https://nostagames.vercel.app/",
        "numberOfItems": games.length,
        "itemListElement": games.map((game, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "VideoGame",
                "name": game.title,
                "description": game.description || game.description_en || `العب ${game.title} مجاناً`,
                "image": game.image,
                "contentRating": game.ageRating,
                "genre": game.categories.join(', ') || 'Arcade',
                "gamePlatform": ["Web Browser", "Android"],
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "url": `https://nostagames.vercel.app/#game=${game.id}`
            }
        }))
    };
    
    return JSON.stringify(schema, null, 2);
}

// ===== توليد النص المخفي للـ SEO =====
function generateSeoHiddenText(games) {
    const items = games.map(game => {
        const desc = game.description || game.description_en || '';
        return `<h2>${escapeHtml(game.title)}</h2><p>${escapeHtml(desc)}</p>`;
    }).join('\n');
    
    return `<div style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true" id="seo-hidden-content">
${items}
</div>`;
}

// ===== مساعد: Escape HTML =====
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ===== الوظيفة الرئيسية =====
async function build() {
    console.log('🚀 [Build] بدء عملية البناء لـ NostGames...\n');
    
    // 1. قراءة index.html الأصلي
    let html = fs.readFileSync(INDEX_PATH, 'utf8');
    
    // 2. جلب الألعاب من Firebase
    const games = await fetchGamesFromFirebase();
    
    // 3. تجهيز window.gamesDatabase كـ JSON للحقن في HTML
    const gamesJson = JSON.stringify(games);
    
    // 4. توليد المكونات
    const gridHTML = generateGamesGridHTML(games);
    const schemaLD = generateSchemaLD(games);
    const seoHidden = generateSeoHiddenText(games);
    
    // ===== حقن window.gamesDatabase =====
    const dbScript = `<script id="server-games-db">
/* ⚡ Static Snapshot — injected at build time by build.js */
window.gamesDatabase = ${gamesJson};
window.__serverSnapshot = true;
window.__snapshotCount = ${games.length};
console.log('[NostGames] Server snapshot loaded: ${games.length} games');
</script>`;

    // ===== حقن Schema JSON-LD المحدث =====
    const schemaScript = `<script type="application/ld+json" id="server-games-schema">
${schemaLD}
</script>`;

    // ===== حقن Grid الأولي =====
    const gridInjected = `<div id="games-grid" class="games-grid">
${gridHTML}
</div>`;

    // ===== تطبيق الحقن على index.html =====

    html = html.replace(
        /[\s\S]*?<\/script>/,
        ''
    );

    html = html.replace(
        /<meta name="keywords"[^>]*>/,
        `<meta name="keywords" content="ألعاب فلاش, العاب فلاش قديمة, العاب فلاش للاندرويد, محاكي فلاش للموبايل, flash games android, retro flash games, nostagames, fireboy watergirl, papa's games, hobo game, jacksmith, cactus mccoy">`
    );

    html = html.replace('</head>', `${dbScript}\n${schemaScript}\n</head>`);

    html = html.replace(
        /<div id="games-grid" class="games-grid"><\/div>/,
        gridInjected
    );

    html = html.replace('</body>', `${seoHidden}\n</body>`);

    // 5. كتابة index.html المحدث
    fs.writeFileSync(INDEX_PATH, html, 'utf8');
    
    console.log('\n✅ [Build] اكتمل البناء بنجاح!');
    console.log(`   📦 الألعاب المحقونة: ${games.length}`);
    console.log(`   📄 index.html تم تحديثه`);
    console.log(`   🔍 Schema JSON-LD تم حقنه`);
    console.log(`   🌐 النص المخفي للـ SEO تم حقنه\n`);
}

// تشغيل عملية البناء
build().catch(err => {
    console.error('💥 [Build] فشل البناء:', err);
    process.exit(0);
});
