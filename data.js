// =============================================
//   NOSTAGAMES - GAMES DATABASE
//   أضف ألعابك هنا بنفس الهيكل
// =============================================

const gamesDatabase = [
    // ===== أضف ألعابك هنا =====
    // كل لعبة تحتاج:
    //   id:       معرّف فريد
    //   image:    "images/IMAGE_01.png" أو رابط خارجي
    //   type:     "swf" أو "iframe"
    //   src:      مسار ملف اللعبة أو رابطها
    //   category: "action" أو "cooking" أو "puzzle"

    {
        id: "game_01",
        image: "images/IMAGE_01.png",
        type: "swf",
        src: "assets/games/game01.swf",
        category: "action",
        isNew: false
    },
    {
        id: "game_02",
        image: "images/IMAGE_02.png",
        type: "swf",
        src: "assets/games/game02.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_03",
        image: "images/IMAGE_03.png",
        type: "swf",
        src: "assets/games/game03.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_04",
        image: "images/IMAGE_04.png",
        type: "swf",
        src: "assets/games/game04.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_05",
        image: "images/IMAGE_05.png",
        type: "swf",
        src: "assets/games/game05.swf",
        category: "action",
        isNew: false
    },
    {
        id: "game_06",
        image: "images/IMAGE_06.png",
        type: "swf",
        src: "assets/games/game06.swf",
        category: "action",
        isNew: false
    },
    {
        id: "game_07",
        image: "images/IMAGE_07.png",
        type: "swf",
        src: "assets/games/game07.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_08",
        image: "images/IMAGE_08.png",
        type: "swf",
        src: "assets/games/game08.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_09",
        image: "images/IMAGE_09.png",
        type: "swf",
        src: "assets/games/game09.swf",
        category: "cooking",
        isNew: false
    },
    {
        id: "game_10",
        image: "images/IMAGE_10.png",
        type: "swf",
        src: "assets/games/game10.swf",
        category: "puzzle",
        isNew: false
    },
    // ===== استمر في الإضافة حتى IMAGE_30 =====
    // {
    //     id: "game_11",
    //     image: "images/IMAGE_11.png",
    //     type: "swf",
    //     src: "assets/games/game11.swf",
    //     category: "action",
    //     isNew: false
    // },
];

// =============================================
//   جمل الشخصيات (ستظهر في فقاعات الكلام)
// =============================================
const mascotDialogues = {
    alone: [
        "هل جربت لعبة Papa's؟ 🍕",
        "أنا أسرع منك! 💨",
        "العب معي! 🎮",
        "الفلاش لم يمت! ⚡",
        "أين ذهبت طفولتي؟ 😢",
        "حمّل التطبيق! 📱",
        "Flash إلى الأبد! 🔥",
        "من يوقفني؟! 🏃",
    ],
    meeting: [
        "أخيراً! كنت وحيداً 👻",
        "تنافس؟! لن تفوز! 😤",
        "لعبة Fireboy أصعب منك! 🔥",
        "شاهدت Hobo 3؟ 👊",
        "من هو أسرع منا؟ 🏁",
        "صديقي القديم! ❤️",
        "تعالَ نلعب Jacksmith! ⚒️",
    ],
    fight: [
        "خذ هذا! 👊💥",
        "لن تهزمني! 😡",
        "ألعاب الأكشن أفضل! 🎯",
        "أنا البطل هنا! 🏆",
    ]
};
