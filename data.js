// Database of all available games
// Adhere to SoC: This file contains ONLY data, no logic.

const gamesDatabase = [
    {
        id: "game_01",
        title: "Classic Mario Flash",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNQhaKAk5O_B0FO36Or9GF24xKsqXXYZBeGqUZ37KSmg&s=10",
        type: "swf",
        src: "assets/games/earth-taken-2-158340d56.swf",
        ageRating: "+3"   // أخضر
    },
    // يمكنك إضافة المئات بنفس الهيكل
    // مثال لإضافة لعبة أخرى:
    // {
    //     id: "game_02",
    //     title: "Fireboy and Watergirl",
    //     image: "رابط الصورة",
    //     type: "swf",
    //     src: "assets/games/fireboy.swf",
    //     ageRating: "+7"   // أزرق
    // }
];

// الألعاب السرية (تُفتح بكود سري)
const secretGames = {
    password: "",      // سيتم تعيينه لاحقاً
    games: []          // سيتم إضافة ألعاب سرية هنا
};

// Dictionary for Internationalization (i18n) - لم يتغير
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