/* =============================================
   NOSTAGAMES - MAIN ENGINE v9.0 (SSG Optimized, Smart Layout)
   ============================================= */

// تم إزالة مكتبات Firebase بالكامل. البيانات ستأتي من خلال الـ HTML المولد مسبقاً.

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
    if (typeof initLoadingsBar === 'function') initLoadingsBar();

    hydrateGames();
});

/* =============================================
   HYDRATE GAMES (تفعيل الألعاب التي طبعها السيرفر)
   ============================================= */
function hydrateGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.game-card');
    
    cards.forEach((card, idx) => {
        const id = card.dataset.id;
        const game = window.gamesDatabase.find(g => g.id === id);
        
        if (game) {
            card.addEventListener('click', () => showGamePanel(game));
        }
        
        setTimeout(() => { card.classList.add('visible'); }, idx * 55);
    });

    initBgIcons();
    initCarousel();
    initSearch();
    initRandomGame();
}

/* =============================================
   ADBLOCK DETECTION (محسن للعمل عند الطلب)
   ============================================= */
function initAdBlockDetection() {
    const continueBtn = document.getElementById('adblock-continue-btn');
    const wall = document.getElementById('adblock-wall');

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (isAdBlockActive()) {
                const note = document.querySelector('.adblock-note');
                if (note) note.innerHTML = '❌ لا يزال مانع الإعلانات مفعّلاً. يرجى تعطيله أولاً.';
            } else {
                if (wall) wall.classList.add('hidden');
                document.body.style.overflow = '';
                
                if (window.pendingAdBlockAction) {
                    window.pendingAdBlockAction();
                    window.pendingAdBlockAction = null;
                }
            }
        });
    }
}

function isAdBlockActive() {
    const bait1 = document.getElementById('ab-bait1');
    const bait2 = document.getElementById('ab-bait2');
    if (bait1 && (bait1.offsetHeight === 0 || bait1.offsetWidth === 0 || getComputedStyle(bait1).display === 'none')) return true;
    if (bait2 && (bait2.offsetHeight === 0 || getComputedStyle(bait2).display === 'none')) return true;
    return false;
}

function checkAdBlockAndExecute(actionCallback) {
    if (isAdBlockActive()) {
        const wall = document.getElementById('adblock-wall');
        if (wall) {
            window.pendingAdBlockAction = actionCallback;
            wall.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    } else {
        actionCallback();
    }
}

function initAppBanner() {
    const banner = document.getElementById('app-banner');
    const closeBtn = document.getElementById('banner-close');
    if (!banner) return;
    if (sessionStorage.getItem('banner_closed')) {
        banner.classList.add('hidden');
        return;
    }
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

/* ===== RE-RENDER GAMES (تعديل العرض بدون إعادة بناء الواجهة) ===== */
function renderGames(filterText = '') {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.game-card');
    const lower = filterText.toLowerCase();

    cards.forEach(card => {
        const titleEl = card.querySelector('.game-title');
        if (!titleEl) return;
        const title = titleEl.textContent.toLowerCase();
        if (title.includes(lower)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

/* ===== POPUP MODAL ===== */
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
                    <span class="panel-age age-badge age-${(game.ageRating||'+3').replace('+','').replace('V','').replace('B','')}">${game.ageRating}</span>
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
    
    document.getElementById('panel-play-btn').onclick = () => { 
        panel.remove(); 
        checkAdBlockAndExecute(() => openGame(game)); 
    };
}

function initSearch() {
    const searchInput = document.getElementById('search-games');
    if (!searchInput) return;
    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => renderGames(e.target.value), 300);
    });
}

function initRandomGame() {
    const btn = document.getElementById('random-game-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (window.gamesDatabase.length === 0) return;
        const game = window.gamesDatabase[Math.floor(Math.random() * window.gamesDatabase.length)];
        checkAdBlockAndExecute(() => openGame(game));
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
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    window.addEventListener('keydown', (e) => {
        const key = e.key === 'b' || e.key === 'a' ? e.key.toLowerCase() : e.key;
        if (key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                unlockSecretGames();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    const logo = document.querySelector('.hero-logo');
    if (logo) {
        let tapCount = 0;
        let tapTimer;
        logo.addEventListener('click', () => {
            if (window.innerWidth > 768) return;
            tapCount++;
            clearTimeout(tapTimer);
            tapTimer = setTimeout(() => { tapCount = 0; }, 1000);
            if (tapCount === 5) {
                const pass = prompt('🔐 أدخل كلمة السر السريعة:');
                if (pass === 'nostagames') unlockSecretGames();
                tapCount = 0;
            }
        });
    }
}

function unlockSecretGames() {
    if (window.secretGames && window.secretGames.games && window.secretGames.games.length > 0) {
        const newGames = window.secretGames.games.filter(g => !window.gamesDatabase.some(ex => ex.id === g.id));
        if (newGames.length) {
            window.gamesDatabase.push(...newGames);
            
            const grid = document.getElementById('games-grid');
            newGames.forEach((game, idx) => {
                const card = document.createElement('div');
                card.className = 'game-card';
                card.dataset.id = game.id;

                const img = document.createElement('img');
                img.src = game.image;
                img.alt = game.title;
                img.loading = 'lazy';

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
                grid.appendChild(card);
                setTimeout(() => { if (card.parentNode) card.classList.add('visible'); }, idx * 55);
            });
            alert('🎉 تم فتح الألعاب السرية! 🎉');
        } else {
            alert('✨ كود سري صحيح! لكن لا توجد ألعاب سرية جديدة حالياً.');
        }
    } else {
        alert('🔓 كود سري صحيح! سيتم إضافة ألعاب سرية قريباً.');
    }
}

function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.style.display = window.scrollY > 500 ? 'flex' : 'none';
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function showPixelLoadingBar(onComplete) {
    const barContainer = document.createElement('div');
    barContainer.className = 'pixel-loading-overlay';
    barContainer.innerHTML = `
        <div class="pixel-loading-container" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:rgba(0,0,0,0.8);padding:20px;border:2px solid #fff;">
            <div style="color:#0f0;font-family:monospace;margin-bottom:10px;">LOADING...</div>
            <div style="width:200px;height:20px;border:2px solid #fff;"><div class="fill" style="width:0%;height:100%;background:#0f0;"></div></div>
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

const KEY_DICT = {
    'A': { code: 65, key: 'a', codeStr: 'KeyA' }, 'B': { code: 66, key: 'b', codeStr: 'KeyB' },
    'C': { code: 67, key: 'c', codeStr: 'KeyC' }, 'D': { code: 68, key: 'd', codeStr: 'KeyD' },
    'E': { code: 69, key: 'e', codeStr: 'KeyE' }, 'F': { code: 70, key: 'f', codeStr: 'KeyF' },
    'G': { code: 71, key: 'g', codeStr: 'KeyG' }, 'H': { code: 72, key: 'h', codeStr: 'KeyH' },
    'I': { code: 73, key: 'i', codeStr: 'KeyI' }, 'J': { code: 74, key: 'j', codeStr: 'KeyJ' },
    'K': { code: 75, key: 'k', codeStr: 'KeyK' }, 'L': { code: 76, key: 'l', codeStr: 'KeyL' },
    'M': { code: 77, key: 'm', codeStr: 'KeyM' }, 'N': { code: 78, key: 'n', codeStr: 'KeyN' },
    'O': { code: 79, key: 'o', codeStr: 'KeyO' }, 'P': { code: 80, key: 'p', codeStr: 'KeyP' },
    'Q': { code: 81, key: 'q', codeStr: 'KeyQ' }, 'R': { code: 82, key: 'r', codeStr: 'KeyR' },
    'S': { code: 83, key: 's', codeStr: 'KeyS' }, 'T': { code: 84, key: 't', codeStr: 'KeyT' },
    'U': { code: 85, key: 'u', codeStr: 'KeyU' }, 'V': { code: 86, key: 'v', codeStr: 'KeyV' },
    'W': { code: 87, key: 'w', codeStr: 'KeyW' }, 'X': { code: 88, key: 'x', codeStr: 'KeyX' },
    'Y': { code: 89, key: 'y', codeStr: 'KeyY' }, 'Z': { code: 90, key: 'z', codeStr: 'KeyZ' },
    'SPACE': { code: 32, key: ' ', codeStr: 'Space' },
    'UP': { code: 38, key: 'ArrowUp', codeStr: 'ArrowUp' },
    'DOWN': { code: 40, key: 'ArrowDown', codeStr: 'ArrowDown' },
    'LEFT': { code: 37, key: 'ArrowLeft', codeStr: 'ArrowLeft' },
    'RIGHT': { code: 39, key: 'ArrowRight', codeStr: 'ArrowRight' }
};

function triggerRuffleKeyEvent(type, keyName) {
    const keyData = KEY_DICT[keyName.toUpperCase()];
    if (!keyData) return;
    const event = new KeyboardEvent(type, {
        bubbles: true, cancelable: true,
        keyCode: keyData.code, which: keyData.code,
        key: keyData.key, code: keyData.codeStr
    });
    window.dispatchEvent(event);
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.dispatchEvent(event);
}

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
    toolbar.style.cssText = 'position:absolute;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:15px;pointer-events:auto;z-index:10000;background:rgba(0,0,0,0.6);padding:5px 15px;border-radius:20px;backdrop-filter:blur(5px);';
    
    const swapBtn = document.createElement('button');
    swapBtn.innerHTML = '<i class="fa-solid fa-arrows-left-right"></i>';
    swapBtn.className = 'ctrl-toolbar-btn';
    const editBtn = document.createElement('button');
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.className = 'ctrl-toolbar-btn';
    const saveBtn = document.createElement('button');
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ';
    saveBtn.className = 'ctrl-toolbar-btn';
    saveBtn.style.display = 'none';
    const sizePlusBtn = document.createElement('button');
    sizePlusBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-plus"></i>';
    sizePlusBtn.className = 'ctrl-toolbar-btn';
    sizePlusBtn.style.display = 'none';
    const sizeMinusBtn = document.createElement('button');
    sizeMinusBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-minus"></i>';
    sizeMinusBtn.className = 'ctrl-toolbar-btn';
    sizeMinusBtn.style.display = 'none';
    
    const btnStyle = 'background:transparent;color:#fff;border:none;font-size:18px;cursor:pointer;padding:5px;';
    [swapBtn, editBtn, saveBtn, sizePlusBtn, sizeMinusBtn].forEach(b => b.style.cssText += btnStyle);
    
    toolbar.appendChild(swapBtn);
    toolbar.appendChild(editBtn);
    toolbar.appendChild(sizeMinusBtn);
    toolbar.appendChild(sizePlusBtn);
    toolbar.appendChild(saveBtn);
    wrapper.appendChild(toolbar);
    
    const elementsContainer = document.createElement('div');
    elementsContainer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    wrapper.appendChild(elementsContainer);
    
    let savedLayout = JSON.parse(localStorage.getItem('nosta_ctrls_' + gameId));
    let layoutMap = {};
    if (!savedLayout) {
        if (hasJoystick) layoutMap['JOYSTICK'] = { x: 10, y: 60, size: 120 };
        const centerX = 80, centerY = 70, radius = 12;
        if (actionKeys.length === 1) layoutMap[actionKeys[0]] = { x: centerX, y: centerY, size: 60 };
        else if (actionKeys.length === 2) {
            layoutMap[actionKeys[0]] = { x: centerX - 8, y: centerY + 5, size: 60 };
            layoutMap[actionKeys[1]] = { x: centerX + 8, y: centerY - 5, size: 60 };
        } else if (actionKeys.length === 3) {
            layoutMap[actionKeys[0]] = { x: centerX - 8, y: centerY + 8, size: 60 };
            layoutMap[actionKeys[1]] = { x: centerX + 8, y: centerY + 8, size: 60 };
            layoutMap[actionKeys[2]] = { x: centerX, y: centerY - 10, size: 60 };
        } else if (actionKeys.length === 4) {
            layoutMap[actionKeys[0]] = { x: centerX, y: centerY + 12, size: 60 };
            layoutMap[actionKeys[1]] = { x: centerX - 10, y: centerY, size: 60 };
            layoutMap[actionKeys[2]] = { x: centerX, y: centerY - 12, size: 60 };
            layoutMap[actionKeys[3]] = { x: centerX + 10, y: centerY, size: 60 };
        } else {
            const angleStep = (2 * Math.PI) / actionKeys.length;
            actionKeys.forEach((key, index) => {
                const angle = index * angleStep;
                layoutMap[key] = { x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), size: 55 };
            });
        }
    } else {
        layoutMap = savedLayout;
    }
    
    let controlElements = [];
    if (hasJoystick) {
        const joyData = layoutMap['JOYSTICK'] || { x: 10, y: 60, size: 120 };
        const joy = createAnalogStick(useWasd);
        applyElementStyle(joy, joyData.x, joyData.y, joyData.size);
        joy.dataset.id = 'JOYSTICK';
        elementsContainer.appendChild(joy);
        controlElements.push(joy);
    }
    
    actionKeys.forEach(key => {
        const btnData = layoutMap[key] || { x: 50, y: 50, size: 60 };
        const btn = createActionButton(key);
        applyElementStyle(btn, btnData.x, btnData.y, btnData.size);
        btn.dataset.id = key;
        elementsContainer.appendChild(btn);
        controlElements.push(btn);
    });
    
    container.appendChild(wrapper);
    
    swapBtn.onclick = () => {
        controlElements.forEach(el => {
            const currentX = parseFloat(el.style.left);
            el.style.left = (100 - currentX - (parseFloat(el.style.width)/window.innerWidth*100)) + '%';
        });
    };
    
    editBtn.onclick = () => {
        controlsEditMode = true;
        editBtn.style.display = 'none';
        swapBtn.style.display = 'none';
        saveBtn.style.display = 'block';
        sizePlusBtn.style.display = 'block';
        sizeMinusBtn.style.display = 'block';
        wrapper.style.backgroundColor = 'rgba(0,0,0,0.4)';
        controlElements.forEach(el => {
            el.classList.add('edit-mode');
            el.style.border = '2px dashed #0f0';
        });
    };
    
    saveBtn.onclick = () => {
        controlsEditMode = false;
        currentEditTarget = null;
        editBtn.style.display = 'block';
        swapBtn.style.display = 'block';
        saveBtn.style.display = 'none';
        sizePlusBtn.style.display = 'none';
        sizeMinusBtn.style.display = 'none';
        wrapper.style.backgroundColor = 'transparent';
        const newLayout = {};
        controlElements.forEach(el => {
            el.classList.remove('edit-mode');
            el.style.border = el.dataset.id === 'JOYSTICK' ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.5)';
            newLayout[el.dataset.id] = {
                x: parseFloat(el.style.left),
                y: parseFloat(el.style.top),
                size: parseFloat(el.style.width)
            };
        });
        localStorage.setItem('nosta_ctrls_' + gameId, JSON.stringify(newLayout));
    };
    
    sizePlusBtn.onclick = () => {
        if (currentEditTarget) {
            let s = parseFloat(currentEditTarget.style.width) + 5;
            currentEditTarget.style.width = s + 'px';
            currentEditTarget.style.height = s + 'px';
        }
    };
    
    sizeMinusBtn.onclick = () => {
        if (currentEditTarget) {
            let s = Math.max(30, parseFloat(currentEditTarget.style.width) - 5);
            currentEditTarget.style.width = s + 'px';
            currentEditTarget.style.height = s + 'px';
        }
    };
    
    controlElements.forEach(el => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        el.addEventListener('touchstart', (e) => {
            if (!controlsEditMode) return;
            e.preventDefault();
            currentEditTarget = el;
            controlElements.forEach(c => c.style.borderColor = c.dataset.id === 'JOYSTICK' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)');
            el.style.borderColor = '#ff0';
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            initialLeft = parseFloat(el.style.left) / 100 * window.innerWidth;
            initialTop = parseFloat(el.style.top) / 100 * window.innerHeight;
        }, {passive: false});
        el.addEventListener('touchmove', (e) => {
            if (!isDragging || !controlsEditMode) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            const newLeft = ((initialLeft + dx) / window.innerWidth) * 100;
            const newTop = ((initialTop + dy) / window.innerHeight) * 100;
            el.style.left = Math.max(0, Math.min(newLeft, 90)) + '%';
            el.style.top = Math.max(0, Math.min(newTop, 90)) + '%';
        }, {passive: false});
        el.addEventListener('touchend', () => { isDragging = false; });
    });
}

function applyElementStyle(el, x, y, size) {
    el.style.position = 'absolute';
    el.style.left = x + '%';
    el.style.top = y + '%';
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.pointerEvents = 'auto';
}

function createAnalogStick(useWasd) {
    const base = document.createElement('div');
    base.style.cssText = 'background:rgba(255,255,255,0.1);border-radius:50%;position:relative;border:2px solid rgba(255,255,255,0.3);box-shadow:inset 0 0 20px rgba(0,0,0,0.5);backdrop-filter:blur(4px);touch-action:none;';
    const knob = document.createElement('div');
    knob.style.cssText = 'width:40%;height:40%;background:rgba(255,255,255,0.5);border-radius:50%;position:absolute;top:30%;left:30%;box-shadow:0 4px 10px rgba(0,0,0,0.5);transition:transform 0.1s ease-out;';
    base.appendChild(knob);
    let activeKeys = [];
    const mapping = useWasd ? { U: 'W', D: 'S', L: 'A', R: 'D' } : { U: 'UP', D: 'DOWN', L: 'LEFT', R: 'RIGHT' };
    
    const updateKeys = (newKeys) => {
        activeKeys.forEach(k => { if (!newKeys.includes(k)) triggerRuffleKeyEvent('keyup', k); });
        newKeys.forEach(k => { if (!activeKeys.includes(k)) triggerRuffleKeyEvent('keydown', k); });
        activeKeys = newKeys;
    };
    
    base.addEventListener('touchstart', handleJoystick, {passive: false});
    base.addEventListener('touchmove', handleJoystick, {passive: false});
    
    function handleJoystick(e) {
        if (controlsEditMode) return;
        e.preventDefault();
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxRadius = rect.width / 2;
        let dx = e.touches[0].clientX - centerX;
        let dy = e.touches[0].clientY - centerY;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance > maxRadius) { dx = (dx / distance) * maxRadius; dy = (dy / distance) * maxRadius; }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        knob.style.transition = 'none';
        
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        let currentDirs = [];
        if (distance > maxRadius * 0.2) {
            if (angle > -112.5 && angle < -67.5) currentDirs.push(mapping.U);
            else if (angle > 67.5 && angle < 112.5) currentDirs.push(mapping.D);
            else if (angle > -22.5 && angle < 22.5) currentDirs.push(mapping.R);
            else if (angle > 157.5 || angle < -157.5) currentDirs.push(mapping.L);
            else if (angle >= -67.5 && angle <= -22.5) currentDirs.push(mapping.U, mapping.R);
            else if (angle >= -157.5 && angle <= -112.5) currentDirs.push(mapping.U, mapping.L);
            else if (angle >= 22.5 && angle <= 67.5) currentDirs.push(mapping.D, mapping.R);
            else if (angle >= 112.5 && angle <= 157.5) currentDirs.push(mapping.D, mapping.L);
        }
        updateKeys(currentDirs);
    }
    
    const resetJoystick = (e) => {
        if (controlsEditMode) return;
        e.preventDefault();
        knob.style.transform = `translate(0px, 0px)`;
        knob.style.transition = 'transform 0.2s ease-out';
        updateKeys([]);
    };
    
    base.addEventListener('touchend', resetJoystick, {passive: false});
    base.addEventListener('touchcancel', resetJoystick, {passive: false});
    return base;
}

function createActionButton(keyName) {
    const btn = document.createElement('button');
    const displayText = keyName.toUpperCase() === 'SPACE' ? 'SP' : keyName.toUpperCase();
    btn.innerHTML = `<strong>${displayText}</strong>`;
    btn.style.cssText = 'background:rgba(255,255,255,0.15);color:#fff;border:2px solid rgba(255,255,255,0.5);border-radius:50%;font-family:monospace;font-size:18px;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);box-shadow:0 4px 6px rgba(0,0,0,0.3);touch-action:none;';
    
    const press = (e) => {
        if (controlsEditMode) return;
        e.preventDefault();
        btn.style.background = 'rgba(255,255,255,0.5)';
        triggerRuffleKeyEvent('keydown', keyName);
    };
    const release = (e) => {
        if (controlsEditMode) return;
        e.preventDefault();
        btn.style.background = 'rgba(255,255,255,0.15)';
        triggerRuffleKeyEvent('keyup', keyName);
    };
    
    btn.addEventListener('touchstart', press, {passive: false});
    btn.addEventListener('touchend', release, {passive: false});
    btn.addEventListener('touchcancel', release, {passive: false});
    return btn;
}

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
                if (finalUrl.includes('archive.org') || finalUrl.includes('http')) finalUrl = '/api/proxy?url=' + encodeURIComponent(game.src);
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
        const smartControls = document.getElementById('smart-controls-wrapper');
        if (smartControls) smartControls.remove();
        try { screen.orientation?.unlock(); } catch(e) {}
        if (document.fullscreenElement) document.exitFullscreen?.();
    };
}

function initCarousel() {
    const grid = document.getElementById('games-grid');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!grid || !prev || !next) return;
    const scrollAmt = () => Math.min(window.innerWidth * 0.75, 300);
    next.addEventListener('click', () => grid.scrollBy({ left: scrollAmt(), behavior: 'smooth' }));
    prev.addEventListener('click', () => grid.scrollBy({ left: -scrollAmt(), behavior: 'smooth' }));
}

function initBgIcons() {
    const layer = document.getElementById('bg-icons-layer');
    if (!layer || window.gamesDatabase.length === 0) return;
    layer.innerHTML = '';
    const total = Math.min(window.gamesDatabase.length, 12);
    for (let i = 0; i < total; i++) {
        const game = window.gamesDatabase[i % window.gamesDatabase.length];
        const img = document.createElement('img');
        img.src = game.image;
        img.className = 'bg-icon';
        img.onerror = () => img.remove();
        img.style.left = (Math.random() * 95) + '%';
        img.style.animationDuration = (14 + Math.random() * 18) + 's';
        img.style.animationDelay = '-' + (Math.random() * 14) + 's';
        const size = (38 + Math.random() * 28) + 'px';
        img.style.width = size;
        img.style.height = size;
        layer.appendChild(img);
    }
}

function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.feature-card, .section-title, .android-section, .reveal').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

function initDownloadBtns() {
    const APK_URL = 'https://archive.org/download/n-core-nostagames-debug_20260523/N-CORE-NOSTAGAMES-debug.apk';
    ['download-btn', 'android-download-btn', 'banner-download-btn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof NPCSystem !== 'undefined') NPCSystem.onDownloadClick();
                checkAdBlockAndExecute(() => {
                    window.location.href = APK_URL;
                });
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

window.openGame = openGame;
window.renderGames = renderGames;
