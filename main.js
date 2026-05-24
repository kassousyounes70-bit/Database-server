/* =============================================
   NOSTAGAMES - MAIN ENGINE v3.0 (كامل)
   ============================================= */

document.addEventListener("DOMContentLoaded", () => {
    initAdBlockDetection();
    initAppBanner();
    initCounter();
    renderGames();
    initBgIcons();
    initMascots();
    initScrollReveal();
    initDownloadBtns();
    initCarousel();
    initFullscreen();
    updateSocialLinks();
});

/* ===== ADBLOCK DETECTION ===== */
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
    function check3() {
        const bait = document.getElementById('ab-bait3');
        if (!bait) return true;
        return bait.offsetHeight === 0 || getComputedStyle(bait).display === 'none';
    }
    function check4() {
        const style = document.getElementById('adStyleBait');
        if (!style) return true;
        return getComputedStyle(document.documentElement).getPropertyValue('--ad-check') === 'blocked';
    }

    setTimeout(() => {
        adBlockDetected = check1() || check2() || check3();
        if (adBlockDetected) showAdBlockWall();
    }, 800);
    setTimeout(() => {
        if (!adBlockDetected) {
            adBlockDetected = check1() || check2();
            if (adBlockDetected) showAdBlockWall();
        }
    }, 2000);

    function showAdBlockWall() {
        wall.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    continueBtn.addEventListener('click', () => {
        const stillBlocked = check1() || check2() || check3();
        if (stillBlocked) {
            const box = document.querySelector('.adblock-box');
            box.style.animation = 'none';
            box.offsetHeight;
            box.style.animation = 'wallShake 0.4s ease';
            const note = document.querySelector('.adblock-note');
            note.textContent = '❌ لا يزال مانع الإعلانات مفعّلاً. يرجى تعطيله أولاً.';
            note.style.color = '#e74c3c';
        } else {
            wall.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

/* ===== APP BANNER ===== */
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

/* ===== COUNTER ===== */
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

/* ===== RENDER GAMES (بدون فلتر) ===== */
function renderGames() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (typeof gamesDatabase === 'undefined') return;
    gamesDatabase.forEach((game, idx) => {
        const card = document.createElement('div');
        card.className = 'game-card' + (game.isNew ? ' is-new' : '');
        const img = document.createElement('img');
        img.src = game.image;
        img.alt = 'لعبة';
        img.loading = 'lazy';
        img.onerror = () => card.remove();
        card.appendChild(img);
        card.addEventListener('click', () => openGame(game));
        grid.appendChild(card);
    });
}

/* ===== CAROUSEL أزرار التمرير ===== */
function initCarousel() {
    const leftBtn = document.getElementById('carousel-left');
    const rightBtn = document.getElementById('carousel-right');
    const grid = document.getElementById('games-grid');
    if (!leftBtn || !rightBtn || !grid) return;
    leftBtn.addEventListener('click', () => {
        grid.scrollBy({ left: -200, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
        grid.scrollBy({ left: 200, behavior: 'smooth' });
    });
}

/* ===== FULLSCREEN ===== */
function initFullscreen() {
    const fullBtn = document.getElementById('fullscreen-btn');
    const player = document.getElementById('game-player');
    if (!fullBtn) return;
    fullBtn.addEventListener('click', () => {
        if (player.requestFullscreen) player.requestFullscreen();
        else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
        else if (player.msRequestFullscreen) player.msRequestFullscreen();
    });
}

/* ===== OPEN GAME ===== */
function openGame(game) {
    const player = document.getElementById('game-player');
    const canvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const titleEl = document.getElementById('playing-title');
    const closeBtn = document.getElementById('close-btn');
    titleEl.textContent = '▶ ' + (game.id || 'لعبة');
    canvas.innerHTML = '';
    overlay.style.display = 'flex';
    player.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    let launched = false;
    const launch = () => {
        if (launched) return;
        launched = true;
        overlay.style.display = 'none';
        if (game.type === 'swf') {
            const ruffle = window.RufflePlayer?.newest();
            if (ruffle) {
                const p = ruffle.createPlayer();
                p.style.width = '100%';
                p.style.height = '100%';
                canvas.appendChild(p);
                p.load(game.src);
            } else {
                canvas.innerHTML = '<p style="color:#f1c40f;text-align:center;padding:40px;">⚠️ جاري تحميل محرك Flash... أعد المحاولة</p>';
            }
        } else if (game.type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = game.src;
            iframe.allowFullscreen = true;
            iframe.allow = 'fullscreen';
            canvas.appendChild(iframe);
        }
    };
    overlay.onclick = launch;
    const spaceHandler = (e) => {
        if (e.code === 'Space' && !launched) {
            e.preventDefault();
            launch();
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
        document.removeEventListener('keydown', spaceHandler);
    };
}

/* ===== BACKGROUND ICONS ===== */
function initBgIcons() {
    const layer = document.getElementById('bg-icons-layer');
    if (!layer || typeof gamesDatabase === 'undefined' || gamesDatabase.length === 0) return;
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

/* ===== MASCOTS (محسّنة) ===== */
function initMascots() {
    const container = document.getElementById('mascot-container');
    const bubble = document.getElementById('speech-bubble');
    const bubbleText = document.getElementById('speech-text');
    if (!container) return;

    const mario = createMarioChar();
    mario.classList.add('pixel-char', 'mario-char', 'walking');
    container.appendChild(mario);
    const ghost = createGhostChar();
    ghost.classList.add('pixel-char', 'ghost-char', 'floating');
    container.appendChild(ghost);

    let marioX = 10, ghostX = 80;
    let marioDir = 1, ghostDir = -1;
    const speed = 0.22;
    let isTalking = false, isExit = false, frame = 0, meetCooldown = 0;

    function setPos(el, x) { el.style.left = x + '%'; }
    setPos(mario, marioX);
    setPos(ghost, ghostX);

    const mascotDialogues = {
        alone: [ "هل جربت لعبة Papa's؟ 🍕", "أنا أسرع منك! 💨", "العب معي! 🎮", "الفلاش لم يمت! ⚡", "أين ذهبت طفولتي؟ 😢", "حمّل التطبيق! 📱", "Flash إلى الأبد! 🔥", "من يوقفني؟! 🏃" ],
        meeting: [ "أخيراً! كنت وحيداً 👻", "تنافس؟! لن تفوز! 😤", "لعبة Fireboy أصعب منك! 🔥", "شاهدت Hobo 3؟ 👊", "من هو أسرع منا؟ 🏁", "صديقي القديم! ❤️", "تعالَ نلعب Jacksmith! ⚒️" ],
        fight: [ "خذ هذا! 👊💥", "لن تهزمني! 😡", "ألعاب الأكشن أفضل! 🎯", "أنا البطل هنا! 🏆" ]
    };

    function showBubble(text, x, duration = 2500) {
        isTalking = true;
        bubbleText.textContent = text;
        bubble.style.left = Math.min(Math.max(x, 3), 65) + '%';
        bubble.classList.remove('hidden');
        setTimeout(() => { bubble.classList.add('hidden'); isTalking = false; }, duration);
    }
    function pick(pool) { return pool[Math.floor(Math.random() * pool.length)]; }
    function triggerMeeting() {
        const midX = (marioX + ghostX) / 2;
        if (Math.random() < 0.55) showBubble(pick(mascotDialogues.meeting), midX);
        else {
            showBubble(pick(mascotDialogues.fight), midX, 1500);
            mario.style.filter = 'hue-rotate(180deg)';
            ghost.style.filter = 'hue-rotate(180deg)';
            setTimeout(() => { mario.style.filter = ''; ghost.style.filter = ''; marioDir *= -1; ghostDir *= -1; }, 500);
        }
        setTimeout(() => { marioDir *= -1; ghostDir *= -1; }, 900);
    }
    function exitChar(char) {
        isExit = true;
        char.style.transition = 'opacity 0.5s';
        char.style.opacity = '0';
        setTimeout(() => {
            marioX = 105; ghostX = -8;
            setPos(mario, marioX); setPos(ghost, ghostX);
            char.style.opacity = '1';
            char.style.transition = '';
            isExit = false;
        }, 700);
    }
    setInterval(() => {
        if (!isTalking) {
            const x = Math.random() < 0.5 ? marioX : ghostX;
            showBubble(pick(mascotDialogues.alone), x);
        }
    }, 7000 + Math.random() * 5000);

    function tick() {
        frame++;
        if (!isExit && !isTalking) {
            marioX += marioDir * speed;
            ghostX += ghostDir * speed;
            if (marioX > 92) { marioX = 92; marioDir = -1; }
            if (marioX < 1)  { marioX = 1;  marioDir =  1; }
            if (ghostX > 92) { ghostX = 92; ghostDir = -1; }
            if (ghostX < 1)  { ghostX = 1;  ghostDir =  1; }
            mario.style.transform = marioDir < 0 ? 'scaleX(-1)' : '';
            ghost.style.transform = ghostDir < 0 ? 'scaleX(-1)' : '';
            setPos(mario, marioX);
            setPos(ghost, ghostX);
            meetCooldown--;
            if (Math.abs(marioX - ghostX) < 9 && meetCooldown <= 0) {
                meetCooldown = 320;
                triggerMeeting();
            }
        }
        if (frame % 750 === 0 && !isExit) {
            exitChar(Math.random() < 0.5 ? mario : ghost);
        }
        requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function createMarioChar() {
    const el = document.createElement('div');
    el.innerHTML = `<div class="hat"></div><div class="head"></div><div class="eye-l"></div><div class="eye-r"></div><div class="mustache"></div><div class="body"></div><div class="overalls"></div><div class="shoe shoe-l"></div><div class="shoe shoe-r"></div>`;
    return el;
}
function createGhostChar() {
    const el = document.createElement('div');
    el.innerHTML = `<div class="ghost-body"></div><div class="ghost-eyes"><div class="ghost-eye"></div><div class="ghost-eye"></div></div><div class="ghost-pupil ghost-pupil-l"></div><div class="ghost-pupil ghost-pupil-r"></div><div class="ghost-skirt"></div>`;
    return el;
}

/* ===== SCROLL REVEAL ===== */
function initScrollReveal() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.feature-card, .section-title, .android-section').forEach(el => {
        el.classList.add('reveal');
        obs.observe(el);
    });
}

/* ===== DOWNLOAD BUTTONS (رابط APK المباشر) ===== */
function initDownloadBtns() {
    const APK_URL = 'https://archive.org/download/n-core-nostagames-debug_20260523/N-CORE-NOSTAGAMES-debug.apk';
    const ids = ['download-btn', 'android-download-btn', 'banner-download-btn'];
    ids.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = APK_URL;
        });
    });
}

/* ===== تحديث روابط السوشيال ميديا (إزالة واتساب) ===== */
function updateSocialLinks() {
    const whatsapp = document.querySelector('.social-btn.whatsapp');
    if (whatsapp) whatsapp.remove();
    const tg = document.querySelector('.social-btn.telegram');
    const ig = document.querySelector('.social-btn.instagram');
    if (tg) tg.href = 'https://t.me/Nostagames';
    if (ig) ig.href = 'https://ig.me/j/AbbFojH8OYaP8HDa/';
    }
