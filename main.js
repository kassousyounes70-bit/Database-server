/* =============================================
   NOSTAGAMES - MAIN ENGINE v5.0 (FIREBASE + ON-SCREEN CONTROLS)
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
   ADBLOCK DETECTION
   ============================================= */
function initAdBlockDetection() {
    const wall = document.getElementById('adblock-wall');
    const continueBtn = document.getElementById('adblock-continue-btn');
    let adBlockDetected = false;

    function check1() {
        const bait = document.getElementById('ab-bait1');
        if (!bait) return true;
        return bait.offsetHeight === 0 || bait.offsetWidth === 0 ||
               getComputedStyle(bait).display === 'none' ||
               getComputedStyle(bait).visibility === 'hidden';
    }
    function check2() {
        const bait = document.getElementById('ab-bait2');
        if (!bait) return true;
        return bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
    }
    function check3() {
        const bait = document.getElementById('ab-bait3');
        if (!bait) return true;
        return bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
    }
    setTimeout(() => {
        adBlockDetected = check1() || check2() || check3();
        if (adBlockDetected) showWall();
    }, 800);
    setTimeout(() => {
        if (!adBlockDetected && (check1() || check2())) showWall();
    }, 2000);

    function showWall() {
        if(wall) {
            wall.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (check1() || check2() || check3()) {
                const box = document.querySelector('.adblock-box');
                if (box) {
                    box.style.animation = 'none';
                    box.offsetHeight;
                    box.style.animation = 'wallShake 0.4s ease';
                }
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
            banner.style.animation = 'slideUp 0.3s ease forwards';
            setTimeout(() => {
                banner.classList.add('hidden');
                sessionStorage.setItem('banner_closed', '1');
            }, 300);
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
    let current = 0;
    const step = Math.ceil(stored / 80);
    const timer = setInterval(() => {
        current = Math.min(current + step, stored);
        el.textContent = current.toLocaleString('ar-EG');
        if (current >= stored) clearInterval(timer);
    }, 25);
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
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="no-results">🎮 لا توجد ألعاب مطابقة 🔍</div>';
    }
}

/* ===== SEARCH ===== */
function initSearch() {
    const searchInput = document.getElementById('search-games');
    if (!searchInput) return;
    let timeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            renderGames(e.target.value);
        }, 300);
    });
}

/* ===== RANDOM GAME ===== */
function initRandomGame() {
    const btn = document.getElementById('random-game-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (window.gamesDatabase.length === 0) return;
        const randomIndex = Math.floor(Math.random() * window.gamesDatabase.length);
        const game = window.gamesDatabase[randomIndex];
        openGame(game);
    });
}

/* ===== SHARE ===== */
function initShare() {
    const btn = document.getElementById('share-game-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'NostGames',
                text: 'تعال العب ألعاب Flash الكلاسيكية مجاناً!',
                url: window.location.href
            }).catch(() => {});
        } else {
            alert('مشاركة غير مدعومة في هذا المتصفح');
        }
    });
}

/* ===== SECRET CODE ===== */
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
                if (pass === 'nostagames') {
                    unlockSecretGames();
                }
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

/* ===== BACK TO TOP ===== */
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) btn.style.display = 'flex';
        else btn.style.display = 'none';
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ===== LOADING BAR ===== */
function showPixelLoadingBar(onComplete) {
    const barContainer = document.createElement('div');
    barContainer.className = 'pixel-loading-overlay';
    barContainer.innerHTML = `
        <div class="pixel-loading-container">
            <div class="pixel-loading-bar">
                <div class="pixel-loading-fill"></div>
            </div>
            <div class="pixel-loading-text">LOADING...</div>
        </div>
    `;
    document.body.appendChild(barContainer);
    let width = 0;
    const interval = setInterval(() => {
        width += Math.random() * 20 + 5;
        if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                barContainer.remove();
                if (onComplete) onComplete();
            }, 200);
        }
        const fill = barContainer.querySelector('.pixel-loading-fill');
        if (fill) fill.style.width = Math.min(width, 100) + '%';
    }, 80);
}

/* ===== ON-SCREEN CONTROLS (MOBILE) ===== */
function renderOnScreenControls(controls, container) {
    if (!controls || (!controls.p1 && !controls.wasd)) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'on-screen-controls';
    controlsContainer.style.position = 'absolute';
    controlsContainer.style.inset = '0';
    controlsContainer.style.pointerEvents = 'none'; 
    controlsContainer.style.zIndex = '9999';

    const p1Controls = controls.p1;
    if (p1Controls && typeof p1Controls === 'object') {
        for (const keyName in p1Controls) {
            const btnData = p1Controls[keyName];
            if (!btnData || btnData === "") continue;

            const btn = document.createElement('button');
            btn.style.position = 'absolute';
            btn.style.left = btnData.x + '%';
            btn.style.top = btnData.y + '%';
            btn.style.width = btnData.size + 'px'; 
            btn.style.height = btnData.size + 'px';
            btn.style.pointerEvents = 'auto';
            
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
            btn.style.border = '2px solid rgba(255, 255, 255, 0.4)';
            btn.style.borderRadius = '50%';
            if (btnData.image) {
                // يفترض وجود مجلد صور للأزرار
                btn.style.backgroundImage = `url('images/controls/${btnData.image}')`; 
                btn.style.backgroundSize = 'contain';
                btn.style.backgroundRepeat = 'no-repeat';
                btn.style.backgroundPosition = 'center';
            }
            btn.style.backdropFilter = 'blur(4px)';
            btn.style.touchAction = 'none'; 
            btn.style.userSelect = 'none';

            const keyCode = getKeyCode(keyName);

            const pressHandler = (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(255, 255, 255, 0.4)';
                simulateKeyEvent('keydown', keyCode, keyName);
            };
            const releaseHandler = (e) => {
                e.preventDefault();
                btn.style.background = 'rgba(255, 255, 255, 0.15)';
                simulateKeyEvent('keyup', keyCode, keyName);
            };

            btn.addEventListener('touchstart', pressHandler, {passive: false});
            btn.addEventListener('touchend', releaseHandler, {passive: false});
            btn.addEventListener('touchcancel', releaseHandler, {passive: false});

            controlsContainer.appendChild(btn);
        }
    }
    container.appendChild(controlsContainer);
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
    const event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        keyCode: keyCode,
        which: keyCode,
        key: keyName
    });
    window.dispatchEvent(event);
    const rufflePlayer = document.querySelector('ruffle-player');
    if (rufflePlayer) {
        rufflePlayer.dispatchEvent(event);
    }
}

/* ===== GAME PLAYER ===== */
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
    if (isMobile) requestLandscape();

    let launched = false;

    const launchGame = () => {
        if (launched) return;
        launched = true;
        overlay.style.display = 'none';
        canvas.innerHTML = '';

        // توليد الأزرار الافتراضية إذا كان المستخدم يتصفح من هاتف
        if (isMobile && game.controls) {
            renderOnScreenControls(game.controls, canvas);
        }

        if (game.type === 'swf') {
            window.RufflePlayer = window.RufflePlayer || {};
            const ruffle = window.RufflePlayer.newest();
            if (ruffle) {
                const p = ruffle.createPlayer();
                p.style.width = '100%';
                p.style.height = '100%';
                p.style.touchAction = 'none'; // منع التمرير أثناء اللعب
                canvas.appendChild(p);
                p.load(game.src);
            } else {
                canvas.innerHTML = '<p style="color:#f1c40f;text-align:center;padding:40px;font-size:0.65rem;">⚠️ جاري تحميل محرك Flash...</p>';
            }
        } else if (game.type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = game.src;
            iframe.allowFullscreen = true;
            canvas.appendChild(iframe);
        }
    };

    overlay.onclick = () => {
        showPixelLoadingBar(launchGame);
    };
    const spaceHandler = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            showPixelLoadingBar(launchGame);
            document.removeEventListener('keydown', spaceHandler);
        }
    };
    document.addEventListener('keydown', spaceHandler);

    closeBtn.onclick = () => {
        player.classList.add('hidden');
        canvas.innerHTML = '';
        launched = false;
        overlay.style.display = 'flex';
        document.body.style.overflow = '';
        releaseLandscape();
        document.removeEventListener('keydown', spaceHandler);
    };
}

/* ===== CAROUSEL ===== */
function initCarousel() {
    const grid = document.getElementById('games-grid');
    const prev = document.getElementById('carousel-prev');
    const next = document.getElementById('carousel-next');
    if (!grid || !prev || !next) return;

    const scrollAmt = () => Math.min(window.innerWidth * 0.75, 300);

    next.addEventListener('click', () => {
        grid.scrollBy({ left: scrollAmt(), behavior: 'smooth' });
    });
    prev.addEventListener('click', () => {
        grid.scrollBy({ left: -scrollAmt(), behavior: 'smooth' });
    });

    const updateBtns = () => {
        if (!grid || !prev || !next) return;
        prev.style.opacity = grid.scrollLeft > 10 ? '1' : '0.3';
        next.style.opacity = grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 10 ? '1' : '0.3';
    };
    grid.addEventListener('scroll', updateBtns);
    updateBtns();
}

/* ===== FLOATING BACKGROUND ICONS ===== */
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
        img.alt = '';
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

/* ===== SCROLL REVEAL ===== */
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

/* ===== DOWNLOAD BUTTONS ===== */
function initDownloadBtns() {
    const APK_URL = 'https://archive.org/download/n-core-nostagames-debug_20260523/N-CORE-NOSTAGAMES-debug.apk';

    const btns = ['download-btn', 'android-download-btn', 'banner-download-btn'];
    btns.forEach(id => {
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

/* ===== FULLSCREEN & LANDSCAPE ===== */
function initFullscreen() {
    const fsBtn = document.getElementById('fullscreen-btn');
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    if (!fsBtn) return;

    if (isMobile) {
        fsBtn.style.display = 'none';
    }

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

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });
}

function requestLandscape() {
    try {
        screen.orientation?.lock('landscape').catch(() => {});
    } catch(e) {}
}

function releaseLandscape() {
    try {
        screen.orientation?.unlock();
    } catch(e) {}
}

window.openGame = openGame;
window.renderGames = renderGames;
