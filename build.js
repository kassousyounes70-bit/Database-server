const fs = require('fs');
const path = require('path');

// إعدادات واجهة برمجة تطبيقات Firebase
const FIREBASE_URL = 'https://n-core-nostagames-default-rtdb.firebaseio.com/games.json';
const INDEX_PATH = path.join(__dirname, 'index.html');

async function buildSite() {
    console.log('[1/4] بدء عملية البناء المسبق (SSG)...');

    try {
        // 1. جلب البيانات من Firebase
        console.log(`[2/4] جلب الألعاب من قاعدة البيانات: ${FIREBASE_URL}`);
        const response = await fetch(FIREBASE_URL);
        if (!response.ok) throw new Error(`فشل الاتصال بقاعدة البيانات. الحالة: ${response.status}`);
        
        const data = await response.json();
        if (!data) throw new Error('قاعدة البيانات فارغة أو غير موجودة.');

        // تصفية الألعاب الصالحة فقط وتنسيق المصفوفة
        const gamesArray = Object.values(data).filter(g => g.downloadUrl && g.downloadUrl.trim() !== '');
        console.log(`تم العثور على ${gamesArray.length} لعبة صالحة.`);

        // 2. إعداد المكونات للحقن
        console.log('[3/4] توليد هياكل HTML و JSON-LD...');
        
        // أ. توليد شبكة الألعاب (Games Grid)
        let gamesGridHTML = '';
        gamesArray.forEach((game) => {
            const ageBadge = (game.ageRating || '+3').replace('+', '').replace('V', '').replace('B', '');
            gamesGridHTML += `
                <div class="game-card visible" data-id="${game.id}">
                    <img src="${game.iconUrl || game.image || ''}" alt="${game.name || game.title || ''}" loading="lazy">
                    <div class="age-badge age-${ageBadge}">${game.ageRating || '+3'}</div>
                    <div class="game-title">${game.name || game.title || ''}</div>
                </div>
            `;
        });

        // ب. توليد سكريبت قاعدة البيانات (ليستخدمه main.js بدون Fetch)
        // يجب توحيد مفاتيح البيانات لتطابق ما يتوقعه main.js
        const normalizedGamesDatabase = gamesArray.map(g => ({
            id: g.id,
            title: g.name || g.title,
            image: g.iconUrl || g.image,
            src: g.downloadUrl,
            type: g.downloadUrl.endsWith('.swf') ? 'swf' : 'iframe',
            description: g.description || '',
            description_en: g.description_en || '',
            ageRating: g.ageRating || '+3',
            categories: g.categories || [],
            controls: g.controls || null
        }));
        const databaseScriptHTML = `<script>window.gamesDatabase = ${JSON.stringify(normalizedGamesDatabase)};</script>`;

        // ج. توليد Schema Markup (SEO)
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

        // د. توليد النص المخفي لمحركات البحث (SEO Text)
        let seoTextHTML = '<div style="position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;" aria-hidden="true">';
        normalizedGamesDatabase.forEach(g => {
            seoTextHTML += `<h2>${g.title}</h2><p>${g.description}</p>`;
        });
        seoTextHTML += '</div>';

        // 3. قراءة ملف HTML الأساسي وحقن البيانات
        console.log('[4/4] حقن البيانات في ملف index.html...');
        let htmlContent = fs.readFileSync(INDEX_PATH, 'utf8');

        // استبدال العلامات بالبيانات الحقيقية
        htmlContent = htmlContent.replace('', gamesGridHTML);
        htmlContent = htmlContent.replace('', databaseScriptHTML);
        htmlContent = htmlContent.replace('', schemaHTML);
        htmlContent = htmlContent.replace('', seoTextHTML);

        // حفظ التغييرات في ملف HTML
        fs.writeFileSync(INDEX_PATH, htmlContent, 'utf8');

        console.log('✅ اكتمل البناء بنجاح! ملف index.html أصبح جاهزاً ومكتفياً ذاتياً لمرحلة النشر.');

    } catch (error) {
        console.error('❌ خطأ فادح أثناء البناء المسبق:', error);
        process.exit(1); // إيقاف بناء Vercel في حال فشل جلب البيانات لمنع نشر موقع فارغ
    }
}

buildSite();
              
