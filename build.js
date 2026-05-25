const fs = require('fs');
const path = require('path');

const FIREBASE_URL = 'https://n-core-nostagames-default-rtdb.firebaseio.com/games.json';
const INDEX_PATH = path.join(__dirname, 'index.html');

async function buildSite() {
    console.log('[1/4] بدء عملية البناء المسبق (SSG)...');

    try {
        console.log(`[2/4] جلب الألعاب من قاعدة البيانات: ${FIREBASE_URL}`);
        const response = await fetch(FIREBASE_URL);
        if (!response.ok) throw new Error(`فشل الاتصال بقاعدة البيانات. الحالة: ${response.status}`);
        
        const data = await response.json();
        if (!data) throw new Error('قاعدة البيانات فارغة أو غير موجودة.');

        const gamesArray = Object.values(data).filter(g => g.downloadUrl && g.downloadUrl.trim() !== '');
        console.log(`تم العثور على ${gamesArray.length} لعبة صالحة.`);

        console.log('[3/4] توليد هياكل HTML و JSON-LD...');
        
        // بناء شبكة الألعاب
        let gamesGridHTML = '';
        gamesArray.forEach((game) => {
            const ageBadge = (game.ageRating || '+3').replace('+', '').replace('V', '').replace('B', '');
            gamesGridHTML += `
                <div class="game-card visible" data-id="${game.id}">
                    <img src="${game.iconUrl || game.image || 'images/icon.png'}" alt="${game.name || game.title || ''}" loading="lazy">
                    <div class="age-badge age-${ageBadge}">${game.ageRating || '+3'}</div>
                    <div class="game-title">${game.name || game.title || ''}</div>
                </div>
            `;
        });

        // بناء قاعدة البيانات المحلية للمتصفح
        const normalizedGamesDatabase = gamesArray.map(g => ({
            id: g.id,
            title: g.name || g.title,
            image: g.iconUrl || g.image || "images/icon.png",
            src: g.downloadUrl,
            type: g.downloadUrl.endsWith('.swf') ? 'swf' : 'iframe',
            description: g.description || '',
            description_en: g.description_en || '',
            ageRating: g.ageRating || '+3',
            categories: g.categories || [],
            controls: g.controls || null
        }));
        const databaseScriptHTML = `<script>window.gamesDatabase = ${JSON.stringify(normalizedGamesDatabase)};</script>`;

        // بناء مخطط السيو
        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "ألعاب Flash الكلاسيكية - NostGames",
            "itemListElement": normalizedGamesDatabase.map((g, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "item": {
                    "@type": "VideoGame",
                    "name": g.title,
                    "description": g.description || g.description_en,
                    "image": g.image,
                    "contentRating": g.ageRating,
                    "genre": g.categories.join(', '),
                    "gamePlatform": "Web Browser, Android",
                    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
                }
            }))
        };
        const schemaHTML = `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;

        // بناء النصوص الوصفية المخفية
        let seoTextHTML = '<div style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true">';
        normalizedGamesDatabase.forEach(g => {
            seoTextHTML += `<h2>${g.title}</h2><p>${g.description}</p>`;
        });
        seoTextHTML += '</div>';

        console.log('[4/4] حقن البيانات في ملف index.html...');
        let htmlContent = fs.readFileSync(INDEX_PATH, 'utf8');

        // تنظيف وحقن
        htmlContent = htmlContent.replace('<!-- SSG_INJECT_GAMES_GRID -->', gamesGridHTML);
        htmlContent = htmlContent.replace('<!-- SSG_INJECT_GAMES_DATABASE_SCRIPT -->', databaseScriptHTML);
        htmlContent = htmlContent.replace('<!-- SSG_INJECT_SEO_SCHEMA -->', schemaHTML);
        htmlContent = htmlContent.replace('<!-- SSG_INJECT_SEO_TEXT -->', seoTextHTML);

        fs.writeFileSync(INDEX_PATH, htmlContent, 'utf8');
        console.log('✅ اكتمل البناء بنجاح!');

    } catch (error) {
        console.error('❌ خطأ فادح أثناء البناء المسبق:', error);
        process.exit(1);
    }
}

buildSite();
              
