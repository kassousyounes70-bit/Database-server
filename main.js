/* =============================================
   NOSTAGAMES - MAIN ENGINE v7.0 (Vercel Proxy & Smart Controls)
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

window.gamesDatabase = [];
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

    fetchGamesFromFirebase();
});

/* =============================================
   FIREBASE DATA FETCHING
   ============================================= */
async function fetchGamesFromFirebase() {
    const grid = document.getElementById('games-grid');
    if (grid) grid.innerHTML = '<div class="pixel-loading-text" style="text-align:center; width:100%; padding:20px; color:#f1c40f;">جاري تحميل الألعاب من السيرفر...</div>';

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
                    description: game.description || ""
                });
            }
            
            renderGames();
            initBgIcons();
            initCarousel();
            initSearch();
            initRandomGame();
        } else {
            if (grid) grid.innerHTML = '<div class="no-results">🎮 لا توجد ألعاب متاحة حالياً</div>';
        }
    } catch (error) {
        console.error("خطأ في جلب البيانات من Firebase:", error);
        if (grid) grid.innerHTML = '<div class="no-results">⚠️ حدث خطأ في الاتصال بقاعدة البيانات</div>';
    }
}

/* =============================================
   ADBLOCK DETECTION & UI ELEMENTS
   ============================================= */
function initAdBlockDetection() {
    const wall = document.getElementById('adblock-wall');
    const continueBtn = document.getElementById('adblock-continue-btn');
    let adBlockDetected = false;

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
    setTimeout(() => {
        adBlockDetected = check1() || check2();
        if (adBlockDetected && wall) {
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

/* ===== RENDER GAMES ===== */
function renderGames(filterText = '') {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    grid.innerHTML = '';
    let filtered = [...window.gamesDatabase];
    if (filterText.trim() !== '') {
        const lower = filterText.toLowerCase();
        filtered = window.gamesDatabase.filter(game => game.title.toLowerCase().includes(lower));
    }
    filtered.forEach((game, idx) => {
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
        card.addEventListener('click', () => openGame(game));
        grid.appendChild(card);
        setTimeout(() => { if (card.parentNode) card.classList.add('visible'); }, idx * 55);
    });
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
            renderGames();
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

/* =============================================
   SMART ON-SCREEN CONTROLS (AI DISTRIBUTION)
   ============================================= */
function renderSmartControls(controlsData, container) {
    if (!controlsData || (!controlsData.p1 && !controlsData.wasd)) return;

    const p1 = controlsData.p1 || {};
    let hasJoystick = p1.hasOwnProperty('JOYSTICK') || controlsData.wasd === true;
    
    const actionKeys = Object.keys(p1).filter(k => k !== 'JOYSTICK');

    const wrapper = document.createElement('div');
    wrapper.id = 'smart-controls-wrapper';
    wrapper.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999;display:flex;justify-content:space-between;align-items:flex-end;padding:20px 40px;';

    const swapBtn = document.createElement('button');
    swapBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
    swapBtn.style.cssText = 'position:absolute;top:20px;left:50%;transform:translateX(-50%);pointer-events:auto;background:rgba(0,0,0,0.5);color:#fff;border:1px solid #fff;border-radius:50%;width:40px;height:40px;font-size:16px;backdrop-filter:blur(5px);cursor:pointer;';
    
    swapBtn.onclick = (e) => {
        e.preventDefault();
        const currentDir = wrapper.style.flexDirection;
        wrapper.style.flexDirection = currentDir === 'row-reverse' ? 'row' : 'row-reverse';
    };
    wrapper.appendChild(swapBtn);

    const leftZone = document.createElement('div');
    leftZone.style.cssText = 'width:150px;height:150px;position:relative;display:flex;justify-content:center;align-items:center;pointer-events:auto;';

    if (hasJoystick) {
        leftZone.appendChild(createDPad());
    }

    const rightZone = document.createElement('div');
    rightZone.style.cssText = 'width:200px;display:flex;flex-wrap:wrap-reverse;gap:15px;justify-content:flex-end;align-items:flex-end;pointer-events:auto;';

    actionKeys.forEach(key => {
        const btn = createActionButton(key);
        rightZone.appendChild(btn);
    });

    wrapper.appendChild(leftZone);
    wrapper.appendChild(rightZone);
    container.appendChild(wrapper);
}

function createDPad() {
    const dpad = document.createElement('div');
    dpad.style.cssText = 'width:120px;height:120px;background:rgba(255,255,255,0.1);border-radius:50%;position:relative;border:2px solid rgba(255,255,255,0.3);box-shadow:inset 0 0 20px rgba(0,0,0,0.5);backdrop-filter:blur(4px);';
    
    const dirs = [
        { id: 'UP', code: 38, icon: '▲', style: 'top:5px;left:50%;transform:translateX(-50%);' },
        { id: 'DOWN', code: 40, icon: '▼', style: 'bottom:5px;left:50%;transform:translateX(-50%);' },
        { id: 'LEFT', code: 37, icon: '◀', style: 'left:5px;top:50%;transform:translateY(-50%);' },
        { id: 'RIGHT', code: 39, icon: '▶', style: 'right:5px;top:50%;transform:translateY(-50%);' }
    ];

    dirs.forEach(dir => {
        const btn = document.createElement('button');
        btn.innerHTML = dir.icon;
        btn.style.cssText = `position:absolute;width:40px;height:40px;background:rgba(0,0,0,0.4);color:#fff;border:none;border-radius:50%;font-size:12px;${dir.style}`;
        
        bindTouchEvents(btn, dir.code, dir.id);
        dpad.appendChild(btn);
    });

    return dpad;
}

function createActionButton(keyName) {
    const btn = document.createElement('button');
    const displayText = keyName.toUpperCase() === 'SPACE' ? 'SP' : keyName.toUpperCase();
    btn.innerHTML = `<strong>${displayText}</strong>`;
    
    btn.style.cssText = 'width:55px;height:55px;background:rgba(255,255,255,0.15);color:#fff;border:2px solid rgba(255,255,255,0.5);border-radius:50%;font-family:monospace;font-size:18px;display:flex;justify-content:center;align-items:center;backdrop-filter:blur(4px);box-shadow:0 4px 6px rgba(0,0,0,0.3);';

    const keyCode = getKeyCode(keyName);
    bindTouchEvents(btn, keyCode, keyName);
    
    return btn;
}

function bindTouchEvents(btn, keyCode, keyName) {
    const press = (e) => {
        e.preventDefault();
        btn.style.background = 'rgba(255,255,255,0.5)';
        simulateKeyEvent('keydown', keyCode, keyName);
    };
    const release = (e) => {
        e.preventDefault();
        btn.style.background = 'rgba(255,255,255,0.15)'; 
        simulateKeyEvent('keyup', keyCode, keyName);
    };

    btn.addEventListener('touchstart', press, {passive: false});
    btn.addEventListener('touchend', release, {passive: false});
    btn.addEventListener('touchcancel', release, {passive: false});
}

function getKeyCode(keyName) {
    const keyMap = {
        'A': 65, 'B': 66, 'C': 67, 'D': 68, 'E': 69, 'F': 70, 'G': 71, 'H': 72, 'I': 73, 'J': 74, 'K': 75, 'L': 76, 'M': 77, 'N': 78, 'O': 79, 'P': 80, 'Q': 81, 'R': 82, 'S': 83, 'T': 84, 'U': 85, 'V': 86, 'W': 87, 'X': 88, 'Y': 89, 'Z': 90,
        'SPACE': 32, 'LEFT': 37, 'UP': 38, 'RIGHT': 39, 'DOWN': 40
    };
    return keyMap[keyName.toUpperCase()] || 0;
}

function simulateKeyEvent(type, keyCode, keyName) {
    if (keyCode === 0) return; 
    const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, keyCode: keyCode, which: keyCode, key: keyName });
    window.dispatchEvent(event);
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) rufflePlayer.dispatchEvent(event);
}

/* ===== GAME PLAYER & VERCEL PROXY ===== */
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
            
            if (game.controls) {
                renderSmartControls(game.controls, player); 
            }
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

                // استخدام البروكسي الداخلي لـ Vercel
                let finalUrl = game.src;
                if (finalUrl.includes('archive.org') || finalUrl.includes('http')) {
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
        const smartControls = document.getElementById('smart-controls-wrapper');
        if (smartControls) smartControls.remove();
        
        try { screen.orientation?.unlock(); } catch(e) {}
        if (document.fullscreenElement) document.exitFullscreen?.();
    };
}

/* ===== UI HELPERS ===== */
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

window.openGame = openGame;
window.renderGames = renderGames;
