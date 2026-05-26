/* =============================================
   NOSTAGAMES - MAIN ENGINE v9.2 (Editable & Flip Controls)
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
                controls: game.controls || null,
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

function injectNewGameCard(game) {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    if (grid.querySelector(`[data-id="${game.id}"]`)) return;
    const card = buildGameCard(game);
    grid.appendChild(card);
    setTimeout(() => { if (card.parentNode) card.classList.add('visible'); }, 100);
}

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
                    controls: game.controls || null,
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
   POPUP MODAL — وسط الشاشة مع Blur
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
   ADBLOCK DETECTION (محمي من البوتات)
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
   SMART CONTROLS (قابلة للتعديل والقلب)
   ============================================= */
let editModeActive = false;
let currentGameId = null;
let currentDragElement = null;
let originalLayout = null;

function renderSmartControls(gameId, controlsData, container) {
    if (!controlsData) return;
    currentGameId = gameId;
    const p1 = controlsData.p1 || {};
    const useWasd = controlsData.wasd === true;
    const hasJoystick = p1.hasOwnProperty('JOYSTICK') || useWasd;
    const actionKeys = Object.keys(p1).filter(k => k !== 'JOYSTICK');

    // إزالة أي واجهة سابقة
    const existingWrapper = document.getElementById('smart-controls-wrapper');
    if (existingWrapper) existingWrapper.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'smart-controls-wrapper';
    wrapper.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:160px;pointer-events:none;z-index:10000;direction:ltr;';

    // شريط الأدوات العلوي
    const toolbar = document.createElement('div');
    toolbar.id = 'controls-toolbar';
    toolbar.style.cssText = 'position:absolute;top:-50px;left:0;right:0;display:flex;justify-content:center;gap:15px;background:rgba(0,0,0,0.7);padding:8px;border-radius:20px;pointer-events:auto;z-index:10001;';
    
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '✏️';
    editBtn.title = 'تعديل الأزرار';
    const flipBtn = document.createElement('button');
    flipBtn.innerHTML = '🔄';
    flipBtn.title = 'قلب الاتجاهات (يسار/يمين)';
    const cancelBtn = document.createElement('button');
    cancelBtn.innerHTML = '❌ إلغاء';
    cancelBtn.style.display = 'none';
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '💾 حفظ';
    saveBtn.style.display = 'none';
    const sizePlus = document.createElement('button');
    sizePlus.innerHTML = '➕';
    sizePlus.style.display = 'none';
    const sizeMinus = document.createElement('button');
    sizeMinus.innerHTML = '➖';
    sizeMinus.style.display = 'none';
    
    toolbar.append(editBtn, flipBtn, cancelBtn, saveBtn, sizePlus, sizeMinus);
    wrapper.appendChild(toolbar);

    // مناطق العصا والأزرار (يمكن تبديلها لاحقاً)
    const leftArea = document.createElement('div');
    leftArea.className = 'controls-left';
    leftArea.style.cssText = 'position:absolute;bottom:15px;left:15px;pointer-events:auto;';
    const rightArea = document.createElement('div');
    rightArea.className = 'controls-right';
    rightArea.style.cssText = 'position:absolute;bottom:15px;right:15px;display:flex;gap:15px;pointer-events:auto;';

    let joystickElement = null;
    let actionButtons = [];

    if (hasJoystick) {
        joystickElement = createAnalogStick(useWasd);
        joystickElement.classList.add('ctrl-joystick');
        joystickElement.style.width = '120px';
        joystickElement.style.height = '120px';
        joystickElement.style.borderRadius = '50%';
        joystickElement.style.backgroundColor = 'rgba(0,0,0,0.5)';
        joystickElement.style.border = '2px solid rgba(255,255,255,0.6)';
        leftArea.appendChild(joystickElement);
    }

    actionKeys.forEach(key => {
        const btn = createActionButton(key);
        btn.classList.add('ctrl-action-btn');
        btn.style.width = '70px';
        btn.style.height = '70px';
        btn.style.borderRadius = '50%';
        btn.style.backgroundColor = 'rgba(0,0,0,0.6)';
        btn.style.border = '2px solid white';
        btn.style.color = 'white';
        btn.style.fontSize = '24px';
        btn.style.fontWeight = 'bold';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        rightArea.appendChild(btn);
        actionButtons.push(btn);
    });

    wrapper.appendChild(leftArea);
    wrapper.appendChild(rightArea);
    container.appendChild(wrapper);

    // تحميل التخطيط المحفوظ (إذا وجد)
    const savedLayout = localStorage.getItem(`nosta_layout_${gameId}`);
    const savedFlip = localStorage.getItem(`nosta_flip_${gameId}`);
    let flipped = (savedFlip === 'true');
    if (flipped) {
        // تبديل المناطق
        leftArea.style.left = 'auto';
        leftArea.style.right = '15px';
        rightArea.style.right = 'auto';
        rightArea.style.left = '15px';
    } else {
        leftArea.style.left = '15px';
        leftArea.style.right = 'auto';
        rightArea.style.right = '15px';
        rightArea.style.left = 'auto';
    }

    if (savedLayout) {
        try {
            const layout = JSON.parse(savedLayout);
            if (layout.joystick && joystickElement) {
                joystickElement.style.left = layout.joystick.left;
                joystickElement.style.top = layout.joystick.top;
                joystickElement.style.width = layout.joystick.width;
                joystickElement.style.height = layout.joystick.height;
            }
            actionButtons.forEach((btn, idx) => {
                const key = actionKeys[idx];
                if (layout[key]) {
                    btn.style.left = layout[key].left;
                    btn.style.top = layout[key].top;
                    btn.style.width = layout[key].width;
                    btn.style.height = layout[key].height;
                }
            });
        } catch(e) {}
    }

    // وظائف وضع التعديل
    let editActive = false;
    let selectedElement = null;

    function enableEditMode() {
        editActive = true;
        editBtn.style.display = 'none';
        cancelBtn.style.display = 'inline-block';
        saveBtn.style.display = 'inline-block';
        sizePlus.style.display = 'inline-block';
        sizeMinus.style.display = 'inline-block';
        wrapper.style.backgroundColor = 'rgba(0,0,0,0.3)';
        const allControls = [joystickElement, ...actionButtons].filter(el => el);
        allControls.forEach(el => {
            el.style.border = '3px dashed #ff0';
            el.style.cursor = 'move';
            makeDraggableAndResizable(el, sizePlus, sizeMinus);
        });
    }

    function disableEditMode(cancel = false) {
        editActive = false;
        editBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        sizePlus.style.display = 'none';
        sizeMinus.style.display = 'none';
        wrapper.style.backgroundColor = 'transparent';
        const allControls = [joystickElement, ...actionButtons].filter(el => el);
        allControls.forEach(el => {
            el.style.border = '';
            el.style.cursor = '';
            removeDraggable(el);
        });
        if (cancel && originalLayout) {
            // استعادة التخطيط الأصلي من localStorage أو default
            const defLayout = localStorage.getItem(`nosta_layout_${gameId}`);
            if (defLayout) {
                const layout = JSON.parse(defLayout);
                if (layout.joystick && joystickElement) {
                    joystickElement.style.left = layout.joystick.left;
                    joystickElement.style.top = layout.joystick.top;
                    joystickElement.style.width = layout.joystick.width;
                    joystickElement.style.height = layout.joystick.height;
                }
                actionButtons.forEach((btn, idx) => {
                    const key = actionKeys[idx];
                    if (layout[key]) {
                        btn.style.left = layout[key].left;
                        btn.style.top = layout[key].top;
                        btn.style.width = layout[key].width;
                        btn.style.height = layout[key].height;
                    }
                });
            }
        }
        selectedElement = null;
    }

    function saveLayout() {
        const layout = {};
        if (joystickElement) {
            layout.joystick = {
                left: joystickElement.style.left,
                top: joystickElement.style.top,
                width: joystickElement.style.width,
                height: joystickElement.style.height
            };
        }
        actionButtons.forEach((btn, idx) => {
            const key = actionKeys[idx];
            layout[key] = {
                left: btn.style.left,
                top: btn.style.top,
                width: btn.style.width,
                height: btn.style.height
            };
        });
        localStorage.setItem(`nosta_layout_${gameId}`, JSON.stringify(layout));
        disableEditMode(false);
    }

    function flipControls() {
        flipped = !flipped;
        localStorage.setItem(`nosta_flip_${gameId}`, flipped);
        if (flipped) {
            leftArea.style.left = 'auto';
            leftArea.style.right = '15px';
            rightArea.style.right = 'auto';
            rightArea.style.left = '15px';
        } else {
            leftArea.style.left = '15px';
            leftArea.style.right = 'auto';
            rightArea.style.right = '15px';
            rightArea.style.left = 'auto';
        }
    }

    editBtn.onclick = () => {
        originalLayout = localStorage.getItem(`nosta_layout_${gameId}`);
        enableEditMode();
    };
    cancelBtn.onclick = () => disableEditMode(true);
    saveBtn.onclick = saveLayout;
    flipBtn.onclick = flipControls;

    function makeDraggableAndResizable(el, plusBtn, minusBtn) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        el.addEventListener('touchstart', onDragStart, { passive: false });
        el.addEventListener('mousedown', onDragStart);
        function onDragStart(e) {
            if (!editActive) return;
            e.preventDefault();
            selectedElement = el;
            isDragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startX = clientX;
            startY = clientY;
            startLeft = parseFloat(el.style.left) || 0;
            startTop = parseFloat(el.style.top) || 0;
            window.addEventListener('touchmove', onDragMove);
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('touchend', onDragEnd);
            window.addEventListener('mouseup', onDragEnd);
        }
        function onDragMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let dx = clientX - startX;
            let dy = clientY - startY;
            let newLeft = startLeft + dx;
            let newTop = startTop + dy;
            el.style.left = Math.min(Math.max(0, newLeft), window.innerWidth - el.offsetWidth) + 'px';
            el.style.top = Math.min(Math.max(0, newTop), window.innerHeight - el.offsetHeight) + 'px';
        }
        function onDragEnd() {
            isDragging = false;
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
            window.removeEventListener('mouseup', onDragEnd);
        }
        // resize via buttons
        const resize = (delta) => {
            if (!selectedElement || !editActive) return;
            let w = parseInt(selectedElement.style.width);
            let h = parseInt(selectedElement.style.height);
            if (isNaN(w)) w = 70;
            if (isNaN(h)) h = 70;
            w += delta;
            h += delta;
            if (w < 40) w = 40;
            if (h < 40) h = 40;
            selectedElement.style.width = w + 'px';
            selectedElement.style.height = h + 'px';
        };
        plusBtn.onclick = () => resize(10);
        minusBtn.onclick = () => resize(-10);
    }
    function removeDraggable(el) {
        el.removeEventListener('touchstart', null);
        el.removeEventListener('mousedown', null);
    }
}

function createAnalogStick(useWasd) {
    const base = document.createElement('div');
    base.style.position = 'relative';
    base.style.touchAction = 'none';
    const knob = document.createElement('div');
    knob.style.position = 'absolute';
    knob.style.width = '40%';
    knob.style.height = '40%';
    knob.style.backgroundColor = 'rgba(255,255,255,0.8)';
    knob.style.borderRadius = '50%';
    knob.style.top = '30%';
    knob.style.left = '30%';
    knob.style.transition = 'transform 0.05s linear';
    base.appendChild(knob);

    let activeKeys = [];
    const mapping = useWasd ? { U: 'W', D: 'S', L: 'A', R: 'D' } : { U: 'UP', D: 'DOWN', L: 'LEFT', R: 'RIGHT' };
    const updateKeys = (newKeys) => {
        activeKeys.forEach(k => { if (!newKeys.includes(k)) triggerRuffleKeyEvent('keyup', k); });
        newKeys.forEach(k => { if (!activeKeys.includes(k)) triggerRuffleKeyEvent('keydown', k); });
        activeKeys = newKeys;
    };

    function handleMove(e) {
        if (editModeActive) return;
        e.preventDefault();
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const mr = rect.width / 2;
        let dx = (e.touches ? e.touches[0].clientX : e.clientX) - cx;
        let dy = (e.touches ? e.touches[0].clientY : e.clientY) - cy;
        const dist = Math.hypot(dx, dy);
        if (dist > mr) { dx = dx * mr / dist; dy = dy * mr / dist; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        let dirs = [];
        if (dist > mr * 0.2) {
            if (angle > -112.5 && angle < -67.5) dirs.push(mapping.U);
            else if (angle > 67.5 && angle < 112.5) dirs.push(mapping.D);
            else if (angle > -22.5 && angle < 22.5) dirs.push(mapping.R);
            else if (angle > 157.5 || angle < -157.5) dirs.push(mapping.L);
            else if (angle >= -67.5 && angle <= -22.5) dirs.push(mapping.U, mapping.R);
            else if (angle >= -157.5 && angle <= -112.5) dirs.push(mapping.U, mapping.L);
            else if (angle >= 22.5 && angle <= 67.5) dirs.push(mapping.D, mapping.R);
            else if (angle >= 112.5 && angle <= 157.5) dirs.push(mapping.D, mapping.L);
        }
        updateKeys(dirs);
    }
    function reset() {
        knob.style.transform = 'translate(0px, 0px)';
        updateKeys([]);
    }
    base.addEventListener('touchstart', handleMove, { passive: false });
    base.addEventListener('touchmove', handleMove, { passive: false });
    base.addEventListener('touchend', reset);
    base.addEventListener('touchcancel', reset);
    base.addEventListener('mousedown', handleMove);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', reset);
    return base;
}

function createActionButton(keyName) {
    const btn = document.createElement('button');
    const display = keyName.toUpperCase() === 'SPACE' ? 'SP' : keyName.toUpperCase();
    btn.textContent = display;
    const press = (e) => { e.preventDefault(); triggerRuffleKeyEvent('keydown', keyName); };
    const release = (e) => { e.preventDefault(); triggerRuffleKeyEvent('keyup', keyName); };
    btn.addEventListener('touchstart', press, { passive: false });
    btn.addEventListener('touchend', release);
    btn.addEventListener('touchcancel', release);
    btn.addEventListener('mousedown', press);
    btn.addEventListener('mouseup', release);
    return btn;
}

/* =============================================
   GAME PLAYER (مع تكبير الشاشة)
   ============================================= */
function openGame(game) {
    const player = document.getElementById('game-player');
    const canvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const titleEl = document.getElementById('playing-title');
    const closeBtn = document.getElementById('close-btn');
    if (!player || !canvas || !overlay || !titleEl || !closeBtn) return;

    titleEl.textContent = `▶ ${game.title}`;
    canvas.innerHTML = '';
    overlay.style.display = 'flex';
    player.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // تكبير شاشة اللعب مع ترك مسافة للإعلانات الجانبية
    player.style.width = '100vw';
    player.style.height = 'calc(100vh - 60px)';
    player.style.position = 'fixed';
    player.style.top = '0';
    player.style.left = '0';
    player.style.zIndex = '9999';
    player.style.backgroundColor = '#000';
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.style.width = '100%';
        gameContainer.style.height = '100%';
        gameContainer.style.margin = '0';
        gameContainer.style.padding = '0';
    }
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    let launched = false;

    const launchGame = () => {
        if (launched) return;
        launched = true;
        overlay.style.display = 'none';
        canvas.innerHTML = '';
        if (isMobile) {
            player.requestFullscreen?.().catch(() => {});
            try { screen.orientation?.lock('landscape').catch(() => {}); } catch(e) {}
            if (game.controls) renderSmartControls(game.id, game.controls, player);
        }
        if (game.type === 'swf') {
            window.RufflePlayer = window.RufflePlayer || {};
            const ruffle = window.RufflePlayer.newest();
            if (ruffle) {
                const p = ruffle.createPlayer();
                p.style.width = '100%';
                p.style.height = '100%';
                p.style.touchAction = 'none';
                canvas.appendChild(p);
                let finalUrl = game.src;
                if (finalUrl.includes('archive.org') || finalUrl.startsWith('http')) {
                    finalUrl = '/api/proxy?url=' + encodeURIComponent(game.src);
                }
                p.load(finalUrl);
            }
        } else if (game.type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = game.src;
            iframe.allowFullscreen = true;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            canvas.appendChild(iframe);
        }
    };

    overlay.onclick = () => showPixelLoadingBar(launchGame);

    closeBtn.onclick = () => {
        player.classList.add('hidden');
        canvas.innerHTML = '';
        launched = false;
        overlay.style.display = 'flex';
        document.body.style.overflow = '';
        document.getElementById('smart-controls-wrapper')?.remove();
        try { screen.orientation?.unlock(); } catch(e) {}
        if (document.fullscreenElement) document.exitFullscreen?.();
        // إعادة ضبط حجم اللاعب
        player.style.position = '';
        player.style.width = '';
        player.style.height = '';
    };
}

/* =============================================
   UI HELPERS (متبقي كما هو)
   ============================================= */
function initCarousel() {
    const grid = document.getElementById('games-grid');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!grid||!prev||!next) return;
    const scrollAmt = () => Math.min(window.innerWidth * 0.75, 300);
    next.addEventListener('click', () => grid.scrollBy({left:scrollAmt(),behavior:'smooth'}));
    prev.addEventListener('click', () => grid.scrollBy({left:-scrollAmt(),behavior:'smooth'}));
}

function initBgIcons() {
    const layer = document.getElementById('bg-icons-layer');
    if (!layer||window.gamesDatabase.length===0) return;
    layer.innerHTML = '';
    const total = Math.min(window.gamesDatabase.length, 12);
    for (let i=0; i<total; i++) {
        const game = window.gamesDatabase[i%window.gamesDatabase.length];
        const img = document.createElement('img');
        img.src = game.image;
        img.className = 'bg-icon';
        img.onerror = () => img.remove();
        img.style.left = (Math.random()*95)+'%';
        img.style.animationDuration = (14+Math.random()*18)+'s';
        img.style.animationDelay = '-'+(Math.random()*14)+'s';
        const size = (38+Math.random()*28)+'px';
        img.style.width = img.style.height = size;
        layer.appendChild(img);
    }
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
        });
    }, {threshold:0.1});
    document.querySelectorAll('.feature-card,.section-title,.android-section,.reveal').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

function initDownloadBtns() {
    const APK_URL = 'https://archive.org/download/n-core-nostagames-debug_20260523/N-CORE-NOSTAGAMES-debug.apk';
    ['download-btn','android-download-btn','banner-download-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof NPCSystem !== 'undefined') NPCSystem.onDownloadClick();
                window.location.href = APK_URL;
            });
        }
    });
}

function initFullscreen() {
    const fsBtn = document.getElementById('fullscreen-btn');
    if (!fsBtn) return;
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) fsBtn.style.display = 'none';
    fsBtn.addEventListener('click', () => {
        const player = document.getElementById('game-player');
        if (!player) return;
        if (!document.fullscreenElement) {
            player.requestFullscreen?.();
            fsBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            document.exitFullscreen?.();
            fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });
}

function injectSEOSchema() {
    if (window.__serverSnapshot && document.getElementById('server-games-schema')) return;
    document.getElementById('games-schema')?.remove();
    document.getElementById('seo-text-block')?.remove();

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "ألعاب Flash الكلاسيكية - NostGames",
        "url": "https://nostagames.vercel.app/",
        "numberOfItems": window.gamesDatabase.length,
        "itemListElement": window.gamesDatabase.map((game, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "VideoGame",
                "name": game.title,
                "description": game.description || game.description_en || '',
                "image": game.image,
                "url": `https://nostagames.vercel.app/?game=${game.id}`,
                "contentRating": game.ageRating || '+3',
                "gamePlatform": ["Web Browser", "Android"],
                "offers": {"@type":"Offer","price":"0","priceCurrency":"USD"}
            }
        }))
    };
    const script = document.createElement('script');
    script.id = 'games-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemaData);
    document.head.appendChild(script);

    const seoBlock = document.createElement('div');
    seoBlock.id = 'seo-text-block';
    seoBlock.setAttribute('aria-hidden', 'true');
    seoBlock.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
    seoBlock.innerHTML = window.gamesDatabase.map(game => `
        <article>
            <h2>${game.title}</h2>
            <p>${game.description||''}</p>
            <p>${game.description_en||''}</p>
        </article>
    `).join('');
    document.body.appendChild(seoBlock);
}

window.openGame = openGame;
window.renderGames = renderGames;