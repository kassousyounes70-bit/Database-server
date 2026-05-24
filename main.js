// Database of all available games
// Adhere to SoC: This file contains ONLY data, no logic.

const gamesDatabase = [
    {
        id: "game_01",
        title: "Classic Mario Flash",
        image: "https://example.com/images/mario_icon.png", // رابط مباشر للصورة
        type: "swf", // Options: "swf" or "iframe"
        src: "https://example.com/games/mario.swf" // رابط مباشر لملف الفلاش (يجب أن يدعم CORS)
    },
    {
        id: "game_02",
        title: "Retro Racer",
        image: "https://example.com/images/racer_icon.png",
        type: "iframe",
        src: "https://another-site.com/embed/retro-racer" // رابط مباشر لصفحة Iframe
    },
    {
        id: "game_03",
        title: "Space Invaders",
        image: "https://example.com/images/space_icon.png",
        type: "swf",
        src: "https://example.com/games/space_invaders.swf"
    }
    // You can add hundreds of games here following the exact same object structure.
];

// Dictionary for Internationalization (i18n)
const i18nDictionary = {
    en: {
        instruction: "Please choose your game from the background to play",
        clickToStart: "Click Here or Press Space to Start",
        downloadApp: "Download NOSTAGAMES App",
        downloads: "Downloads:",
        closeGame: "X Close Game",
        adblockTitle: "AdBlocker Detected",
        adblockMsg: "Please disable your AdBlocker to play the games and support us."
    },
    ar: {
        instruction: "يرجى اختيار لعبتك من الخلفية للعبها",
        clickToStart: "اضغط هنا أو على زر المسافة (Space) للبدء",
        downloadApp: "تحميل تطبيق NOSTAGAMES",
        downloads: "عدد التحميلات:",
        closeGame: "X إغلاق اللعبة",
        adblockTitle: "تم اكتشاف مانع إعلانات",
        adblockMsg: "يرجى تعطيل مانع الإعلانات لتتمكن من اللعب ودعم الموقع."
    }
};
