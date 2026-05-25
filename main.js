/* =============================================
   NOSTAGAMES - MAIN ENGINE v3.0 (FULL FEATURES)
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
    initAdBlockDetection();
    initAppBanner();
    initCounter();
    renderGames();
    initBgIcons();
    NPCSystem.init();
    initScrollReveal();
    initCarousel();
    initDownloadBtns();
    initFullscreen();
    initSearch();
    initRandomGame();
    initShare();
    initSecretCode();
    // initDarkMode();  // تم إزالتها
    initBackToTop();
    initLoadingsBar();
});

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
        wall.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    continueBtn.addEventListener('click', () => {
        if (check1() || check2() || check3()) {
            const box = document.querySelector('.adblock-box');
            box.style.animation = 'none';
            box.offsetHeight;
            box.style.animation = 'wallShake 0.4s ease';
            document.querySelector('.adblock-note').innerHTML = '❌ لا يزال مانع الإعلانات مفعّلاً. يرجى تعطيله أولاً.';
        } else {
            wall.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

function initAppBanner() {
    const banner = document.getElementById('app-banner');
    const closeBtn = document.getElementById('banner-close');
    if (sessionStorage.getItem('banner_closed')) {
        banner.classList.add('hidden');
        return;
    }
    closeBtn.addEventListener('click', () => {
        banner.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => {
            banner.classList.add('hidden');
            sessionStorage.setItem('banner_closed', '1');
        }, 300);
    });
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
    let filtered = [...gamesDatabase];
    if (filterText.trim() !== '') {
        const lower = filterText.toLowerCase();
        filtered = gamesDatabase.filter(game => game.title.toLowerCase().includes(lower));
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
        ageBadge.className = `age-badge age-${game.ageRating.replace('+', '')}`;
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
        if (gamesDatabase.length === 0) return;
        const randomIndex = Math.floor(Math.random() * gamesDatabase.length);
        const game = gamesDatabase[randomIndex];
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
    if (secretGames.games && secretGames.games.length > 0) {
        const newGames = secretGames.games.filter(g => !gamesDatabase.some(ex => ex.id === g.id));
        if (newGames.length) {
            gamesDatabase.push(...newGames);
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

/* ===== GAME PLAYER ===== */
function openGame(game) {
    const player = document.getElementById('game-player');
    const canvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const titleEl = document.getElementById('playing-title');
    const closeBtn = document.getElementById('close-btn');

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
        if (game.type === 'swf') {
            window.RufflePlayer = window.RufflePlayer || {};
            const ruffle = window.RufflePlayer.newest();
            if (ruffle) {
                const p = ruffle.createPlayer();
                p.style.width = '100%';
                p.style.height = '100%';
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
    if (!layer || gamesDatabase.length === 0) return;

    const total = Math.min(gamesDatabase.length, 12);
    for (let i = 0; i < total; i++) {
        const game = gamesDatabase[i % gamesDatabase.length];
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

/* ===== DOWNLOAD BUTTONS (مع الرابط المباشر) ===== */
function initDownloadBtns() {
    const APK_URL = 'https://archive.org/download/n-core-nostagames-debug_20260523/N-CORE-NOSTAGAMES-debug.apk';

    const btns = ['download-btn', 'android-download-btn', 'banner-download-btn'];
    btns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                NPCSystem.onDownloadClick();
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

// تصدير الوظائف العامة
window.openGame = openGame;
window.renderGames = renderGames;