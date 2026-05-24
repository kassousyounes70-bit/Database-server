/* =========================================
   NOSTAGAMES - PRO LOGIC ENGINE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    checkAdBlocker();
    initLanguage();
    initSmartCounter();
    renderGames();
    initMascotInteraction();
});

function checkAdBlocker() {
    setTimeout(() => {
        const bait = document.getElementById('anti-adblock-bait');
        const warning = document.getElementById('adblock-warning');
        if (!bait || bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
            warning.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }, 1000);
}

function initLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.startsWith('ar') ? 'ar' : 'en';
    
    if (langCode === 'ar') document.documentElement.dir = 'rtl';

    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    elementsToTranslate.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nDictionary[langCode] && i18nDictionary[langCode][key]) {
            el.innerText = i18nDictionary[langCode][key];
        }
    });
}

function initSmartCounter() {
    const counterElement = document.getElementById('download-counter');
    let currentCount = parseInt(localStorage.getItem('nosta_downloads')) || 8459201;
    currentCount += Math.floor(Math.random() * 5) + 1;
    localStorage.setItem('nosta_downloads', currentCount);
    counterElement.innerText = currentCount.toLocaleString();
}

/* --- ديناميكية الأيقونات المحسنة للهواتف --- */
function renderGames() {
    const container = document.getElementById('icons-container');
    const playerContainer = document.getElementById('game-player-container');
    const gameCanvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const closeBtn = document.getElementById('close-game-btn');
    
    let activeGameData = null;
    const totalGames = gamesDatabase.length;

    gamesDatabase.forEach((game, index) => {
        const icon = document.createElement('img');
        icon.src = game.image;
        icon.className = 'game-icon';
        icon.alt = game.title;

        // توزيع دائري آمن، إذا كانت لعبة واحدة توضع في المنتصف
        if (totalGames === 1) {
            icon.style.left = `calc(50% - 40px)`;
            icon.style.top = `calc(50% - 40px)`;
            // حركة طفو بسيطة للعبة الواحدة
            icon.style.animation = "floatSingle 3s ease-in-out infinite alternate";
        } else {
            const angle = (index / totalGames) * Math.PI * 2;
            // نصف القطر 35% لضمان عدم الخروج من الشاشة في الهواتف
            const radiusX = 35; 
            const radiusY = 35;
            
            icon.style.left = `calc(50% + ${Math.cos(angle) * radiusX}% - 40px)`;
            icon.style.top = `calc(50% + ${Math.sin(angle) * radiusY}% - 40px)`;
        }

        icon.addEventListener('click', () => {
            activeGameData = game;
            document.querySelectorAll('.game-icon').forEach(otherIcon => {
                if (otherIcon !== icon) otherIcon.classList.add('fade-out');
            });

            icon.classList.add('centered');
            
            setTimeout(() => {
                playerContainer.classList.remove('hidden');
                icon.style.display = 'none';
            }, 500);
        });

        container.appendChild(icon);
    });

    const launchGame = () => {
        if (!activeGameData || overlay.style.display === 'none') return;
        overlay.style.display = 'none';
        gameCanvas.innerHTML = '';

        if (activeGameData.type === 'swf') {
            window.RufflePlayer = window.RufflePlayer || {};
            const ruffle = window.RufflePlayer.newest();
            const player = ruffle.createPlayer();
            gameCanvas.appendChild(player);
            player.load(activeGameData.src);
        } else if (activeGameData.type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = activeGameData.src;
            iframe.allowFullscreen = true;
            gameCanvas.appendChild(iframe);
        }
    };

    overlay.addEventListener('click', launchGame);
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !playerContainer.classList.contains('hidden') && overlay.style.display !== 'none') {
            e.preventDefault();
            launchGame();
        }
    });

    closeBtn.addEventListener('click', () => {
        playerContainer.classList.add('hidden');
        overlay.style.display = 'flex';
        gameCanvas.innerHTML = ''; 
        activeGameData = null;
        
        document.querySelectorAll('.game-icon').forEach(icon => {
            icon.style.display = 'block';
            icon.classList.remove('centered');
            icon.classList.remove('fade-out');
        });
    });

    // إضافة حركة الطفو للعبة الواحدة في الستايل ديناميكياً
    if (totalGames === 1) {
        const style = document.createElement('style');
        style.innerHTML = `@keyframes floatSingle { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }`;
        document.head.appendChild(style);
    }
}

/* --- تفاعل الشخصية (المرح الأركيدي) --- */
function initMascotInteraction() {
    const mascot = document.getElementById('retro-mascot');
    const downloadBtn = document.getElementById('download-app-btn');

    // جعل الشخصية تتبع الفأرة على محور X كأنها تجري خلف المؤشر
    document.addEventListener('mousemove', (e) => {
        const screenWidth = window.innerWidth;
        const mouseX = e.clientX;
        // حساب النسبة المئوية لمكان الفأرة
        let percentage = (mouseX / screenWidth) * 100;
        // وضع حدود لكي لا تخرج الشخصية
        if (percentage < 10) percentage = 10;
        if (percentage > 90) percentage = 90;
        mascot.style.left = `${percentage}%`;
    });

    // عند النقر على زر التحميل، تقفز الشخصية وتضرب الزر!
    downloadBtn.addEventListener('click', (e) => {
        // إذا كان هناك رابط فعلي ضعه هنا، الآن نمنع الانتقال لكي نرى التأثير
        e.preventDefault(); 
        
        // إيقاف الجري العادي وبدء القفز
        mascot.classList.remove('running');
        mascot.classList.add('jumping-mascot');
        
        // بعد نصف ثانية (لحظة اصطدام الشخصية بالزر من الأسفل)
        setTimeout(() => {
            downloadBtn.classList.add('btn-hit');
        }, 250); // في منتصف الأنيميشن

        // إزالة الكلاسات لتمكين إعادتها
        setTimeout(() => {
            mascot.classList.remove('jumping-mascot');
            mascot.classList.add('running');
            downloadBtn.classList.remove('btn-hit');
            // هنا يمكنك وضع كود توجيه المستخدم لتحميل التطبيق
            // window.location.href = "رابط التطبيق الخاص بك";
        }, 600);
    });
}
