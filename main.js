/* =============================================
   NOSTAGAMES - MAIN ENGINE v9.0 (Hybrid Hydration + Smart Diff)
   المعمارية الهجينة: Server Snapshot + Firebase Live Sync
   ============================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBjy1mH-Mjikc5aiX_oI2uoGHuI0Y1ZptI",
    authDomain: "n-core-nostagames.firebaseapp.com",
    databaseURL: "https://n-core-nostagames-default-rtdb.firebaseio.com",
    projectId: "n-core-nostagames",
    storageBucket: "n-core-nostagames.firebasestorage.app",
    messagingSenderId: "705596610155",
    appId: "1:705596610155:web:8c076439331d4ff604c32e"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.gamesDatabase = window.gamesDatabase || [];
window.secretGames = { games: [] };

document.addEventListener("DOMContentLoaded", () => {
    initAdBlockDetection();
    initAppBanner();
    initCounter();

    if (typeof NPCSystem !== 'undefined') NPCSystem.init();
    initScrollReveal();
    initDownloadBtns();
    initFullscreen();
    initShare();
    initSecretCode();
    initBackToTop();

    // ==============================
    // الترطيب الأولي (Initial Hydration)
    // ==============================
    if (window.__serverSnapshot && window.gamesDatabase.length > 0) {
        console.log(`[NostGames] ⚡ Hydrating from server snapshot: ${window.gamesDatabase.length} games`);
        renderGames();
        injectSEOSchema();
        initBgIcons();
        initCarousel();
        initSearch();
        initRandomGame();

        silentSyncWithFirebase();
    } else {
        console.log('[NostGames] No server snapshot found, fetching from Firebase directly...');
        fetchGamesFromFirebase();
    }
});

// ===== دالة مساعدة لتجريد أزرار التحكم الديناميكية =====
function extractCleanControls(rawControls) {
    if (!rawControls) return null;
    const cleaned = { p1: {}, wasd: !!rawControls.wasd };
    if (rawControls.p1) {
        for (const key in rawControls.p1) {
            cleaned.p1[key] = {};
        }
    }
    return cleaned;
}

/* =============================================
   المزامنة الصامتة (Silent Sync + Diff & Merge)
   ============================================= */
async function silentSyncWithFirebase() {
    try {
        const gamesRef = ref(db, 'games');
        const snapshot = await get(gamesRef);

        if (!snapshot.exists()) return;

        const data = snapshot.val();
        const existingIds = new Set(window.gamesDatabase.map(g => g.id));
        let newGamesCount = 0;

        for (const key in data) {
            if (key === 'ban_01') continue;
            const game = data[key];
            if (!game.downloadUrl || game.downloadUrl.trim() === "") continue;

            if (existingIds.has(key)) continue;

            const newGame = {
                id: key,
                title: game.name || "بدون اسم",
                image: game.iconUrl || "images/icon.png",
                src: game.downloadUrl,
                ageRating: game.ageRating || "+3",
                type: game.downloadUrl.toLowerCase().endsWith('.swf') ? 'swf' : 'iframe',
                controls: extractCleanControls(game.controls),
                description: game.description || "",
                description_en: game.description_en || "",
                categories: game.categories || []
            };

            window.gamesDatabase.push(newGame);
            existingIds.add(key);
            newGamesCount++;

            injectNewGameCard(newGame);
        }

        if (newGamesCount > 0) {
            console.log(`[NostGames] 🆕 Silent sync: added ${newGamesCount} new game(s) from Firebase`);
            initSearch();
            initRandomGame();
        } else {
            console.log('[NostGames] ✅ Silent sync complete: no new games');
        }

    } catch (error) {
        console.warn('[NostGames] Silent sync failed (non-critical):', error.message);
    }
}

/* =============================================
   الحقن الديناميكي للعبة الجديدة
   ============================================= */
function injectNewGameCard(game) {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    if (grid.querySelector(`[data-id="${game.id}"]`)) return;

    const card = buildGameCard(game);
    grid.appendChild(card);
    setTimeout(() => { if (card.parentNode) card.classList.add('visible'); }, 100);
}

/* =============================================
   الجلب المباشر من Firebase (Fallback بدون Snapshot)
   ============================================= */
async function fetchGamesFromFirebase() {
    const grid = document.getElementById('games-grid');
    if (grid) grid.innerHTML = '<div class="pixel-loading-text" style="text-align:center;width:100%;padding:20px;color:#f1c40f;">جاري تحميل الألعاب...</div>';

    try {
        const gamesRef = ref(db, 'games');
        const snapshot = await get(gamesRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            window.gamesDatabase = [];

            for (const key in data) {
                if (key === 'ban_01') continue;
                const game = data[key];
                if (!game.downloadUrl || game.downloadUrl.trim() === "") continue;

                window.gamesDatabase.push({
                    id: key,
                    title: game.name || "بدون اسم",
                    image: game.iconUrl || "images/icon.png",
                    src: game.downloadUrl,
                    ageRating: game.ageRating || "+3",
                    type: game.downloadUrl.toLowerCase().endsWith('.swf') ? 'swf' : 'iframe',
                    controls: extractCleanControls(game.controls),
                    description: game.description || "",
                    description_en: game.description_en || "",
                    categories: game.categories || []
                });
            }

            renderGames();
            injectSEOSchema();
            initBgIcons();
            initCarousel();
            initSearch();
            initRandomGame();
        } else {
            if (grid) grid.innerHTML = '<div class="no-results">🎮 لا توجد ألعاب متاحة حالياً</div>';
        }
    } catch (error) {
        console.error("خطأ في جلب البيانات من Firebase:", error);
        if (grid) grid.innerHTML = '<div class="no-results">⚠️ حدث خطأ في الاتصال. يرجى إعادة المحاولة.</div>';
    }
}

/* =============================================
   بناء بطاقة لعبة واحدة
   ============================================= */
function buildGameCard(game, idx = 0) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.id = game.id;

    const img = document.createElement('img');
    img.src = game.image;
    img.alt = game.title;
    img.loading = 'lazy';
    img.onerror = () => card.remove();

    const ageBadge = document.createElement('div');
    ageBadge.className = `age-badge age-${(game.ageRating || '+3').replace('+', '')}`;
    ageBadge.textContent = game.ageRating;

    const titleSpan = document.createElement('div');
    titleSpan.className = 'game-title';
    titleSpan.textContent = game.title;

    card.appendChild(img);
    card.appendChild(ageBadge);
    card.appendChild(titleSpan);
    card.addEventListener('click', () => showGamePanel(game));
    setTimeout(() => { if (card.parentNode) card.classList.add('visible'); }, idx * 55);

    return card;
}

/* =============================================
   عرض الألعاب في الـ Grid
   ============================================= */
function renderGames(filterText = '') {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let filtered = [...window.gamesDatabase];
    if (filterText.trim() !== '') {
        const lower = filterText.toLowerCase();
        filtered = window.gamesDatabase.filter(game =>
            game.title.toLowerCase().includes(lower) ||
            (game.description || '').toLowerCase().includes(lower)
        );
    }

    filtered.forEach((game, idx) => {
        grid.appendChild(buildGameCard(game, idx));
    });
}

/* =============================================
   POPUP MODAL
   ============================================= */
function showGamePanel(game) {
    document.getElementById('game-panel')?.remove();

    const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    const desc = lang === 'ar'
        ? (game.description || game.description_en || '')
        : (game.description_en || game.description || '');

    const ageColors = {
        '+3': '#2ecc71', '+7': '#3498db',
        '+12': '#f39c12', '+16': '#e67e22', '+18': '#e74c3c'
    };
    const ageColor = ageColors[game.ageRating] || '#2ecc71';
    const cats = (game.categories || []).map(c => `<span class="panel-cat">${c}</span>`).join('');

    const panel = document.createElement('div');
    panel.id = 'game-panel';
    panel.className = 'game-panel-backdrop';
    panel.innerHTML = `
        <div class="game-panel-modal" role="dialog" aria-modal="true">
            <button class="panel-close-btn" id="panel-close-btn" aria-label="إغلاق">✕</button>
            <div class="panel-hero">
                <img src="${game.image}" alt="${game.title}" class="panel-icon" onerror="this.src='images/icon.png'">
                <div class="panel-hero-glow" style="background:radial-gradient(circle, ${ageColor}33 0%, transparent 70%);"></div>
            </div>
            <div class="panel-body">
                <h3 class="panel-title">${game.title}</h3>
                <div class="panel-meta">
                    <span class="panel-age-badge" style="background:${ageColor}22;color:${ageColor};border-color:${ageColor}66;">
                        🔞 ${game.ageRating}
                    </span>
                    ${cats ? `<div class="panel-cats">${cats}</div>` : ''}
                </div>
                <p class="panel-desc">${desc || '<span class="panel-no-desc">لا يوجد وصف متاح لهذه اللعبة.</span>'}</p>
            </div>
            <button class="panel-play-btn" id="panel-play-btn">
                <i class="fa-solid fa-play"></i> ابدأ اللعبة
            </button>
        </div>
    `;

    document.body.appendChild(panel);

    function closePanel() {
        panel.classList.add('panel-closing');
        setTimeout(() => panel.remove(), 250);
    }

    const onKey = (e) => { if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
    panel.addEventListener('click', e => { if (e.target === panel) { closePanel(); document.removeEventListener('keydown', onKey); } });
    document.getElementById('panel-close-btn').onclick = closePanel;
    document.getElementById('panel-play-btn').onclick = () => { closePanel(); setTimeout(() => openGame(game), 260); };

    requestAnimationFrame(() => panel.classList.add('panel-visible'));
}

/* =============================================
   ADBLOCK DETECTION
   ============================================= */
function initAdBlockDetection() {
    const wall = document.getElementById('adblock-wall');
    const continueBtn = document.getElementById('adblock-continue-btn');

    function check1() {
        const bait = document.getElementById('ab-bait1');
        if (!bait) return true;
        return bait.offsetHeight === 0 || bait.offsetWidth === 0 || getComputedStyle(bait).display === 'none';
    }
    function check2() {
        const bait = document.getElementById('ab-bait2');
        if (!bait) return true;
        return bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
    }

    const isBot = /googlebot|bingbot|yandex|duckduckbot|slurp|baiduspider|facebot|ia_archiver/i.test(navigator.userAgent);
    setTimeout(() => {
        if (isBot) return;
        const detected = check1() || check2();
        if (detected && wall) {
            wall.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }, 800);

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (check1() || check2()) {
                const note = document.querySelector('.adblock-note');
                if (note) note.innerHTML = '❌ لا يزال مانع الإعلانات مفعّلاً. يرجى تعطيله أولاً.';
            } else {
                if (wall) wall.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }
}

function initAppBanner() {
    const banner = document.getElementById('app-banner');
    const closeBtn = document.getElementById('banner-close');
    if (!banner) return;
    if (sessionStorage.getItem('banner_closed')) { banner.classList.add('hidden'); return; }
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            banner.classList.add('hidden');
            sessionStorage.setItem('banner_closed', '1');
        });
    }
}

function initCounter() {
    const el = document.getElementById('counter-num');
    if (!el) return;
    const base = 50000;
    let stored = parseInt(localStorage.getItem('ng_count') || base);
    stored += Math.floor(Math.random() * 7) + 1;
    localStorage.setItem('ng_count', stored);
    el.textContent = stored.toLocaleString('ar-EG');
}

function initSearch() {
    const searchInput = document.getElementById('search-games');
    if (!searchInput) return;
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    let timeout;
    newInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => renderGames(e.target.value), 300);
    });
}

function initRandomGame() {
    const btn = document.getElementById('random-game-btn');
    if (!btn) return;
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', () => {
        if (window.gamesDatabase.length === 0) return;
        openGame(window.gamesDatabase[Math.floor(Math.random() * window.gamesDatabase.length)]);
    });
}

function initShare() {
    const btn = document.getElementById('share-game-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({ title: 'NostGames', text: 'العب ألعاب Flash مجاناً!', url: window.location.href }).catch(() => {});
        }
    });
}

function initSecretCode() {
    let konamiIndex = 0;
    const konamiCode = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    window.addEventListener('keydown', (e) => {
        const key = (e.key === 'b' || e.key === 'a') ? e.key.toLowerCase() : e.key;
        if (key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) { unlockSecretGames(); konamiIndex = 0; }
        } else { konamiIndex = 0; }
    });
    const logo = document.querySelector('.hero-logo');
    if (logo) {
        let tapCount = 0, tapTimer;
        logo.addEventListener('click', () => {
            if (window.innerWidth > 768) return;
            tapCount++;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
            if (tapCount === 5) {
                const pass = prompt('🔐 أدخل كلمة السر:');
                if (pass === 'nostagames') unlockSecretGames();
                tapCount = 0;
            }
        });
    }
}

function unlockSecretGames() {
    if (window.secretGames?.games?.length > 0) {
        const newGames = window.secretGames.games.filter(g => !window.gamesDatabase.some(ex => ex.id === g.id));
        if (newGames.length) {
            window.gamesDatabase.push(...newGames);
            renderGames();
            alert('🎉 تم فتح الألعاب السرية!');
        } else {
            alert('✨ كود صحيح! لا توجد ألعاب سرية جديدة حالياً.');
        }
    } else {
        alert('🔓 كود صحيح! ألعاب سرية قريباً.');
    }
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => { btn.style.display = window.scrollY > 500 ? 'flex' : 'none'; });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function showPixelLoadingBar(onComplete) {
    const barContainer = document.createElement('div');
    barContainer.className = 'pixel-loading-overlay';
    barContainer.innerHTML = `
        <div style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:rgba(0,0,0,0.85);padding:24px;border:2px solid #0f0;border-radius:4px;text-align:center;">
            <div style="color:#0f0;font-family:'Press Start 2P',monospace;font-size:12px;margin-bottom:12px;">LOADING...</div>
            <div style="width:200px;height:18px;border:2px solid #0f0;background:#000;"><div class="fill" style="width:0%;height:100%;background:#0f0;transition:width 0.05s;"></div></div>
        </div>
    `;
    document.body.appendChild(barContainer);
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 30 + 10;
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => { barContainer.remove(); if (onComplete) onComplete(); }, 200);
        }
        const fill = barContainer.querySelector('.fill');
        if (fill) fill.style.width = Math.min(width, 100) + '%';
    }, 50);
}

/* =============================================
   KEYBOARD EVENT SIMULATOR
   ============================================= */
const KEY_DICT = {
    'A':{code:65,key:'a',codeStr:'KeyA'},'B':{code:66,key:'b',codeStr:'KeyB'},
    'C':{code:67,key:'c',codeStr:'KeyC'},'D':{code:68,key:'d',codeStr:'KeyD'},
    'E':{code:69,key:'e',codeStr:'KeyE'},'F':{code:70,key:'f',codeStr:'KeyF'},
    'G':{code:71,key:'g',codeStr:'KeyG'},'H':{code:72,key:'h',codeStr:'KeyH'},
    'I':{code:73,key:'i',codeStr:'KeyI'},'J':{code:74,key:'j',codeStr:'KeyJ'},
    'K':{code:75,key:'k',codeStr:'KeyK'},'L':{code:76,key:'l',codeStr:'KeyL'},
    'M':{code:77,key:'m',codeStr:'KeyM'},'N':{code:78,key:'n',codeStr:'KeyN'},
    'O':{code:79,key:'o',codeStr:'KeyO'},'P':{code:80,key:'p',codeStr:'KeyP'},
    'Q':{code:81,key:'q',codeStr:'KeyQ'},'R':{code:82,key:'r',codeStr:'KeyR'},
    'S':{code:83,key:'s',codeStr:'KeyS'},'T':{code:84,key:'t',codeStr:'KeyT'},
    'U':{code:85,key:'u',codeStr:'KeyU'},'V':{code:86,key:'v',codeStr:'KeyV'},
    'W':{code:87,key:'w',codeStr:'KeyW'},'X':{code:88,key:'x',codeStr:'KeyX'},
    'Y':{code:89,key:'y',codeStr:'KeyY'},'Z':{code:90,key:'z',codeStr:'KeyZ'},
    'SPACE':{code:32,key:' ',codeStr:'Space'},
    'UP':{code:38,key:'ArrowUp',codeStr:'ArrowUp'},
    'DOWN':{code:40,key:'ArrowDown',codeStr:'ArrowDown'},
    'LEFT':{code:37,key:'ArrowLeft',codeStr:'ArrowLeft'},
    'RIGHT':{code:39,key:'ArrowRight',codeStr:'ArrowRight'}
};

function triggerRuffleKeyEvent(type, keyName) {
    const keyData = KEY_DICT[keyName.toUpperCase()];
    if (!keyData) return;
    const event = new KeyboardEvent(type, {
        bubbles:true,cancelable:true,
        keyCode:keyData.code,which:keyData.code,
        key:keyData.key,code:keyData.codeStr
    });
    window.dispatchEvent(event);
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.dispatchEvent(event);
}

/* =============================================
   SMART CONTROLS (Analog Stick + Edit Mode)
   ============================================= */
let currentEditTarget = null;
let controlsEditMode = false;

function renderSmartControls(gameId, controlsData, container) {
    if (!controlsData || (!controlsData.p1 && !controlsData.wasd)) return;
  