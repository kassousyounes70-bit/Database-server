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

// window.gamesDatabase قد تكون مملوءة بالفعل من build.js (Server Snapshot)
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
        // البيانات جاهزة من الـ Server Snapshot — عرضها فوراً
        console.log(`[NostGames] ⚡ Hydrating from server snapshot: ${window.gamesDatabase.length} games`);
        renderGames();
        injectSEOSchema();
        initBgIcons();
        initCarousel();
        initSearch();
        initRandomGame();

        // مزامنة صامتة في الخلفية للألعاب الجديدة
        silentSyncWithFirebase();
    } else {
        // لا يوجد snapshot (أول نشر أو بيئة تطوير) — الجلب المباشر
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

        // بناء Set من الـ IDs الموجودة مسبقاً في الـ snapshot
        const existingIds = new Set(window.gamesDatabase.map(g => g.id));
        let newGamesCount = 0;

        for (const key in data) {
            const game = data[key];
            if (!game.downloadUrl || game.downloadUrl.trim() === "") continue;

            // تجاهل الألعاب الموجودة بالفعل
            if (existingIds.has(key)) continue;

            // لعبة جديدة لم تكن في الـ snapshot!
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

            // حقن بطاقة اللعبة الجديدة ديناميكياً في الـ Grid
            injectNewGameCard(newGame);
        }

        if (newGamesCount > 0) {
            console.log(`[NostGames] 🆕 Silent sync: added ${newGamesCount} new game(s) from Firebase`);
            // تحديث محرك البحث بالألعاب الجديدة
            initSearch();
            initRandomGame();
        } else {
            console.log('[NostGames] ✅ Silent sync complete: no new games');
        }

    } catch (error) {
        // فشل الـ sync الصامت لا يؤثر على الموقع
        console.warn('[NostGames] Silent sync failed (non-critical):', error.message);
    }
}

/* =============================================
   الحقن الديناميكي للعبة الجديدة
   ============================================= */
function injectNewGameCard(game) {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    // التأكد من عدم وجود البطاقة بالفعل (guard)
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

/* =============================================
   بناء بطاقة لعبة واحدة (مشترك بين render و inject)
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

    const panel = document.createElement('div');
    panel.id = 'game-panel';
    panel.className = 'game-panel-overlay';
    panel.innerHTML = `
        <div class="game-panel-modal">
            <button class="panel-close" id="panel-close-btn">✕</button>
            <div class="panel-top">
                <img src="${game.image}" alt="${game.title}" class="panel-img">
                <div class="panel-info">
                    <h3 class="panel-title">${game.title}</h3>
                    <span class="panel-age age-badge age-${(game.ageRating||'+3').replace('+','')}">${game.ageRating}</span>
                    <div class="panel-cats">${(game.categories||[]).map(c=>`<span class="panel-cat">${c}</span>`).join('')}</div>
                </div>
            </div>
            <p class="panel-desc">${desc || 'لا يوجد وصف متاح.'}</p>
            <button class="panel-play-btn" id="panel-play-btn">▶ العب الآن</button>
        </div>
    `;

    document.body.appendChild(panel);
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
    document.getElementById('panel-close-btn').onclick = () => panel.remove();
    document.getElementById('panel-play-btn').onclick = () => { panel.remove(); openGame(game); };
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

    // جدار الإعلانات: يعمل فقط عند التفاعل الفعلي (لا يمنع عناكب البحث)
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
    // إزالة المستمع القديم قبل إضافة جديد
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
    // إزالة المستمع القديم
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
    const p1 = controlsData.p1 || {};
    const useWasd = controlsData.wasd === true;
    let hasJoystick = p1.hasOwnProperty('JOYSTICK') || useWasd;
    const actionKeys = Object.keys(p1).filter(k => k !== 'JOYSTICK');

    const wrapper = document.createElement('div');
    wrapper.id = 'smart-controls-wrapper';
    wrapper.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999;direction:ltr;';

    const toolbar = document.createElement('div');
    toolbar.id = 'controls-toolbar';
    toolbar.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:15px;pointer-events:auto;z-index:10000;background:rgba(0,0,0,0.6);padding:5px 15px;border-radius:20px;';

    const mkBtn = (html) => {
        const b = document.createElement('button');
        b.innerHTML = html;
        b.className = 'ctrl-toolbar-btn';
        b.style.cssText = 'background:transparent;color:#fff;border:none;font-size:18px;cursor:pointer;padding:5px;';
        return b;
    };
    const swapBtn = mkBtn('<i class="fa-solid fa-arrows-left-right"></i>');
    const editBtn = mkBtn('<i class="fa-solid fa-pen"></i>');
    const saveBtn = mkBtn('<i class="fa-solid fa-floppy-disk"></i> حفظ');
    const sizePlusBtn = mkBtn('<i class="fa-solid fa-magnifying-glass-plus"></i>');
    const sizeMinusBtn = mkBtn('<i class="fa-solid fa-magnifying-glass-minus"></i>');
    saveBtn.style.display = sizePlusBtn.style.display = sizeMinusBtn.style.display = 'none';
    [swapBtn,editBtn,sizeMinusBtn,sizePlusBtn,saveBtn].forEach(b => toolbar.appendChild(b));
    wrapper.appendChild(toolbar);

    const elementsContainer = document.createElement('div');
    elementsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    wrapper.appendChild(elementsContainer);

    let savedLayout = JSON.parse(localStorage.getItem('nosta_ctrls_' + gameId));
    let layoutMap = {};
    if (!savedLayout) {
        if (hasJoystick) layoutMap['JOYSTICK'] = { x:10, y:60, size:120 };
        const centerX=80, centerY=70, radius=12;
        if (actionKeys.length===1) layoutMap[actionKeys[0]] = {x:centerX,y:centerY,size:60};
        else if (actionKeys.length===2) {
            layoutMap[actionKeys[0]] = {x:centerX-8,y:centerY+5,size:60};
            layoutMap[actionKeys[1]] = {x:centerX+8,y:centerY-5,size:60};
        } else {
            const angleStep=(2*Math.PI)/actionKeys.length;
            actionKeys.forEach((key,i) => {
                const angle=i*angleStep;
                layoutMap[key] = {x:centerX+radius*Math.cos(angle),y:centerY+radius*Math.sin(angle),size:55};
            });
        }
    } else { layoutMap = savedLayout; }

    let controlElements = [];
    if (hasJoystick) {
        const jd = layoutMap['JOYSTICK']||{x:10,y:60,size:120};
        const joy = createAnalogStick(useWasd);
        applyElementStyle(joy, jd.x, jd.y, jd.size);
        joy.dataset.id = 'JOYSTICK';
        elementsContainer.appendChild(joy);
        controlElements.push(joy);
    }
    actionKeys.forEach(key => {
        const bd = layoutMap[key]||{x:50,y:50,size:60};
        const btn = createActionButton(key);
        applyElementStyle(btn, bd.x, bd.y, bd.size);
        btn.dataset.id = key;
        elementsContainer.appendChild(btn);
        controlElements.push(btn);
    });
    container.appendChild(wrapper);

    swapBtn.onclick = () => {
        controlElements.forEach(el => {
            const cx = parseFloat(el.style.left);
            el.style.left = (100 - cx - (parseFloat(el.style.width)/window.innerWidth*100)) + '%';
        });
    };
    editBtn.onclick = () => {
        controlsEditMode=true; editBtn.style.display=swapBtn.style.display='none';
        saveBtn.style.display=sizePlusBtn.style.display=sizeMinusBtn.style.display='block';
        wrapper.style.backgroundColor='rgba(0,0,0,0.4)';
        controlElements.forEach(el => { el.classList.add('edit-mode'); el.style.border='2px dashed #0f0'; });
    };
    saveBtn.onclick = () => {
        controlsEditMode=false; currentEditTarget=null;
        editBtn.style.display=swapBtn.style.display='block';
        saveBtn.style.display=sizePlusBtn.style.display=sizeMinusBtn.style.display='none';
        wrapper.style.backgroundColor='transparent';
        const newLayout={};
        controlElements.forEach(el => {
            el.classList.remove('edit-mode');
            el.style.border=el.dataset.id==='JOYSTICK'?'2px solid rgba(255,255,255,0.3)':'2px solid rgba(255,255,255,0.5)';
            newLayout[el.dataset.id]={x:parseFloat(el.style.left),y:parseFloat(el.style.top),size:parseFloat(el.style.width)};
        });
        localStorage.setItem('nosta_ctrls_'+gameId, JSON.stringify(newLayout));
    };
    sizePlusBtn.onclick = () => { if(currentEditTarget){let s=parseFloat(currentEditTarget.style.width)+5;currentEditTarget.style.width=currentEditTarget.style.height=s+'px';} };
    sizeMinusBtn.onclick = () => { if(currentEditTarget){let s=Math.max(30,parseFloat(currentEditTarget.style.width)-5);currentEditTarget.style.width=currentEditTarget.style.height=s+'px';} };

    controlElements.forEach(el => {
        let isDragging=false,startX,startY,initialLeft,initialTop;
        el.addEventListener('touchstart',(e)=>{
            if(!controlsEditMode)return; e.preventDefault();
            currentEditTarget=el;
            controlElements.forEach(c=>c.style.borderColor=c.dataset.id==='JOYSTICK'?'rgba(255,255,255,0.3)':'rgba(255,255,255,0.5)');
            el.style.borderColor='#ff0'; isDragging=true;
            startX=e.touches[0].clientX; startY=e.touches[0].clientY;
            initialLeft=parseFloat(el.style.left)/100*window.innerWidth;
            initialTop=parseFloat(el.style.top)/100*window.innerHeight;
        },{passive:false});
        el.addEventListener('touchmove',(e)=>{
            if(!isDragging||!controlsEditMode)return; e.preventDefault();
            const dx=e.touches[0].clientX-startX, dy=e.touches[0].clientY-startY;
            el.style.left=Math.max(0,Math.min((initialLeft+dx)/window.innerWidth*100,90))+'%';
            el.style.top=Math.max(0,Math.min((initialTop+dy)/window.innerHeight*100,90))+'%';
        },{passive:false});
        el.addEventListener('touchend',()=>{isDragging=false;});
    });
}

function applyElementStyle(el,x,y,size){
    el.style.position='absolute';el.style.left=x+'%';el.style.top=y+'%';
    el.style.width=size+'px';el.style.height=size+'px';el.style.pointerEvents='auto';
}

function createAnalogStick(useWasd){
    const base=document.createElement('div');
    base.style.cssText='background:rgba(255,255,255,0.1);border-radius:50%;position:relative;border:2px solid rgba(255,255,255,0.3);box-shadow:inset 0 0 20px rgba(0,0,0,0.5);touch-action:none;';
    const knob=document.createElement('div');
    knob.style.cssText='width:40%;height:40%;background:rgba(255,255,255,0.5);border-radius:50%;position:absolute;top:30%;left:30%;transition:transform 0.1s ease-out;';
    base.appendChild(knob);
    let activeKeys=[];
    const mapping=useWasd?{U:'W',D:'S',L:'A',R:'D'}:{U:'UP',D:'DOWN',L:'LEFT',R:'RIGHT'};
    const updateKeys=(newKeys)=>{
        activeKeys.forEach(k=>{if(!newKeys.includes(k))triggerRuffleKeyEvent('keyup',k);});
        newKeys.forEach(k=>{if(!activeKeys.includes(k))triggerRuffleKeyEvent('keydown',k);});
        activeKeys=newKeys;
    };
    function handleJoystick(e){
        if(controlsEditMode)return; e.preventDefault();
        const rect=base.getBoundingClientRect();
        const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2, mr=rect.width/2;
        let dx=e.touches[0].clientX-cx, dy=e.touches[0].clientY-cy;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>mr){dx=(dx/dist)*mr;dy=(dy/dist)*mr;}
        knob.style.transform=`translate(${dx}px,${dy}px)`;
        knob.style.transition='none';
        const angle=Math.atan2(dy,dx)*(180/Math.PI);
        let dirs=[];
        if(dist>mr*0.2){
            if(angle>-112.5&&angle<-67.5) dirs.push(mapping.U);
            else if(angle>67.5&&angle<112.5) dirs.push(mapping.D);
            else if(angle>-22.5&&angle<22.5) dirs.push(mapping.R);
            else if(angle>157.5||angle<-157.5) dirs.push(mapping.L);
            else if(angle>=-67.5&&angle<=-22.5) dirs.push(mapping.U,mapping.R);
            else if(angle>=-157.5&&angle<=-112.5) dirs.push(mapping.U,mapping.L);
            else if(angle>=22.5&&angle<=67.5) dirs.push(mapping.D,mapping.R);
            else if(angle>=112.5&&angle<=157.5) dirs.push(mapping.D,mapping.L);
        }
        updateKeys(dirs);
    }
    const resetJoystick=(e)=>{
        if(controlsEditMode)return; e.preventDefault();
        knob.style.transform='translate(0px,0px)'; knob.style.transition='transform 0.2s ease-out';
        updateKeys([]);
    };
    base.addEventListener('touchstart',handleJoystick,{passive:false});
    base.addEventListener('touchmove',handleJoystick,{passive:false});
    base.addEventListener('touchend',resetJoystick,{passive:false});
    base.addEventListener('touchcancel',resetJoystick,{passive:false});
    return base;
}

function createActionButton(keyName){
    const btn=document.createElement('button');
    const displayText=keyName.toUpperCase()==='SPACE'?'SP':keyName.toUpperCase();
    btn.innerHTML=`<strong>${displayText}</strong>`;
    btn.style.cssText='background:rgba(255,255,255,0.15);color:#fff;border:2px solid rgba(255,255,255,0.5);border-radius:50%;font-family:monospace;font-size:18px;display:flex;justify-content:center;align-items:center;touch-action:none;';
    const press=(e)=>{if(controlsEditMode)return;e.preventDefault();btn.style.background='rgba(255,255,255,0.5)';triggerRuffleKeyEvent('keydown',keyName);};
    const release=(e)=>{if(controlsEditMode)return;e.preventDefault();btn.style.background='rgba(255,255,255,0.15)';triggerRuffleKeyEvent('keyup',keyName);};
    btn.addEventListener('touchstart',press,{passive:false});
    btn.addEventListener('touchend',release,{passive:false});
    btn.addEventListener('touchcancel',release,{passive:false});
    return btn;
}

/* =============================================
   GAME PLAYER
   ============================================= */
function openGame(game) {
    const player = document.getElementById('game-player');
    const canvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const titleEl = document.getElementById('playing-title');
    const closeBtn = document.getElementById('close-btn');
    if (!player||!canvas||!overlay||!titleEl||!closeBtn) return;

    titleEl.textContent = `▶ ${game.title}`;
    canvas.innerHTML = '';
    overlay.style.display = 'flex';
    player.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    let launched = false;

    const launchGame = () => {
        if (launched) return;
        launched = true;
        overlay.style.display = 'none';
        canvas.innerHTML = '';
        if (isMobile) {
            player.requestFullscreen?.().catch(()=>{});
            try { screen.orientation?.lock('landscape').catch(()=>{}); } catch(e) {}
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
    };
}

/* =============================================
   UI HELPERS
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

/* =============================================
   SEO: JSON-LD + نص مخفي (للـ Firebase-only fallback)
   ============================================= */
function injectSEOSchema() {
    // إذا كان الـ Server Snapshot موجوداً، لا نكرر schema موجودة
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

// تصدير للاستخدام الخارجي
window.openGame = openGame;
window.renderGames = renderGames;
