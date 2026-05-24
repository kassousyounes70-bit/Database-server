/* =========================================
   NOSTAGAMES - MAIN LOGIC ENGINE
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialize Anti-AdBlocker Check
    checkAdBlocker();

    // 2. Initialize Language (i18n)
    initLanguage();

    // 3. Initialize Smart Counter
    initSmartCounter();

    // 4. Render and Distribute Games
    renderGames();
});

/* --- 1. Anti-AdBlocker --- */
function checkAdBlocker() {
    setTimeout(() => {
        const bait = document.getElementById('anti-adblock-bait');
        const warning = document.getElementById('adblock-warning');
        
        // If the bait is hidden, blocked, or has no height, an AdBlocker is active.
        if (!bait || bait.offsetHeight === 0 || window.getComputedStyle(bait).display === 'none') {
            warning.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
    }, 1000); // Check after 1 second to ensure blockers have executed
}

/* --- 2. Internationalization (i18n) --- */
function initLanguage() {
    // Detect user's browser language, default to 'en'
    const userLang = navigator.language || navigator.userLanguage;
    const langCode = userLang.startsWith('ar') ? 'ar' : 'en';
    
    // Change document direction for Arabic
    if (langCode === 'ar') {
        document.documentElement.dir = 'rtl';
    }

    // Apply translations
    const elementsToTranslate = document.querySelectorAll('[data-i18n]');
    elementsToTranslate.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18nDictionary[langCode] && i18nDictionary[langCode][key]) {
            el.innerText = i18nDictionary[langCode][key];
        }
    });
}

/* --- 3. Smart Download Counter --- */
function initSmartCounter() {
    const counterElement = document.getElementById('download-counter');
    const baseNumber = 8459201; // Your huge starting number
    
    // Retrieve saved count from localStorage, or use base number
    let currentCount = parseInt(localStorage.getItem('nosta_downloads')) || baseNumber;
    
    // Add a random slight increase (1 to 5) every time user visits
    const randomIncrease = Math.floor(Math.random() * 5) + 1;
    currentCount += randomIncrease;
    
    // Save new count
    localStorage.setItem('nosta_downloads', currentCount);
    
    // Format with commas and display
    counterElement.innerText = currentCount.toLocaleString();
}

/* --- 4. Games Rendering & Logic --- */
function renderGames() {
    const container = document.getElementById('icons-container');
    const playerContainer = document.getElementById('game-player-container');
    const gameCanvas = document.getElementById('game-canvas');
    const overlay = document.getElementById('game-overlay');
    const closeBtn = document.getElementById('close-game-btn');
    
    // Dimensions for random distribution
    const containerRect = document.getElementById('interactive-area').getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    let activeGameData = null; // Stores currently selected game

    // Create icons dynamically from database
    gamesDatabase.forEach(game => {
        const icon = document.createElement('img');
        icon.src = game.image;
        icon.className = 'game-icon';
        icon.alt = game.title;
        icon.dataset.id = game.id;

        // Distribute pseudo-randomly around the center (Orbit feel)
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * (Math.min(centerX, centerY) - 80) + 50; // Keep away from edges
        
        const posX = centerX + Math.cos(angle) * radius - 35; // 35 is half icon width
        const posY = centerY + Math.sin(angle) * radius - 35;

        icon.style.left = `${posX}px`;
        icon.style.top = `${posY}px`;
        
        // Add varying animation delays so they don't move exactly together
        icon.style.animationDelay = `${(Math.random() * 2).toFixed(2)}s`;

        // Click Event: Center the icon and prepare game
        icon.addEventListener('click', () => {
            activeGameData = game;
            
            // Hide other icons
            document.querySelectorAll('.game-icon').forEach(otherIcon => {
                if (otherIcon !== icon) {
                    otherIcon.classList.add('fade-out');
                }
            });

            // Center chosen icon
            icon.classList.add('centered');
            
            // Show overlay after a brief delay for animation
            setTimeout(() => {
                playerContainer.classList.remove('hidden');
                icon.style.display = 'none'; // Hide icon behind overlay
            }, 600);
        });

        container.appendChild(icon);
    });

    // Handle Game Launch (Click or Space)
    const launchGame = () => {
        if (!activeGameData || overlay.style.display === 'none') return;
        
        overlay.style.display = 'none';
        
        // Clear previous canvas content
        gameCanvas.innerHTML = '';

        if (activeGameData.type === 'swf') {
            // Setup Ruffle Player
            window.RufflePlayer = window.RufflePlayer || {};
            const ruffle = window.RufflePlayer.newest();
            const player = ruffle.createPlayer();
            gameCanvas.appendChild(player);
            player.load(activeGameData.src);
        } else if (activeGameData.type === 'iframe') {
            // Setup Iframe
            const iframe = document.createElement('iframe');
            iframe.src = activeGameData.src;
            iframe.allowFullscreen = true;
            gameCanvas.appendChild(iframe);
        }
    };

    overlay.addEventListener('click', launchGame);
    
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !playerContainer.classList.contains('hidden') && overlay.style.display !== 'none') {
            e.preventDefault(); // Prevent page scrolling
            launchGame();
        }
    });

    // Close Game Button
    closeBtn.addEventListener('click', () => {
        playerContainer.classList.add('hidden');
        overlay.style.display = 'flex';
        gameCanvas.innerHTML = ''; // Destroy player/iframe to stop audio
        activeGameData = null;
        
        // Reset Icons
        document.querySelectorAll('.game-icon').forEach(icon => {
            icon.style.display = 'block';
            icon.classList.remove('centered');
            icon.classList.remove('fade-out');
        });
    });
}
