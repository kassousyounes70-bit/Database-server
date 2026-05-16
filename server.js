const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// 🚨 قم بمسح عبارة (ضع_كلمة_السر_هنا) والصق كلمة السر الحقيقية التي أرسلتها لي سابقاً
const MONGODB_URI = "mongodb+srv://kassousyounes70_db_user:C0LgWEH4kRa8mqcZ@ncore-vault-db.s8ugksn.mongodb.net/ncore_db?retryWrites=true&w=majority&appName=ncore-vault-db";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ متصل بقاعدة بيانات MongoDB (Vault) بنجاح'))
  .catch(err => console.error('❌ فشل الاتصال بقاعدة البيانات:', err));

// إنشاء هيكل المستخدم (Schema)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: String,
    avatarId: Number,
    coins: Number,
    playHours: Number,
    gamesLoaded: Number,
    tickets: Number,
    lastSyncTime: Number
});

const User = mongoose.model('User', userSchema);

// 1. واجهة التحقق من اسم المستخدم (للمهمة الثالثة في الأندرويد)
app.get('/api/check-username', async (req, res) => {
    try {
        const requestedUsername = req.query.user;
        if (!requestedUsername) {
            return res.status(400).json({ error: "الرجاء توفير اسم مستخدم" });
        }

        const existingUser = await User.findOne({ username: requestedUsername });
        
        if (existingUser) {
            res.json({ available: false });
        } else {
            res.json({ available: true });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "خطأ في الخادم" });
    }
});

// 2. واجهة المزامنة (للمهمة الثانية في الأندرويد - SyncWorker)
app.post('/sync', async (req, res) => {
    try {
        const profileData = req.body;
        
        if (!profileData.username) {
            return res.status(400).json({ error: "اسم المستخدم مفقود" });
        }

        // تحديث البيانات إذا كان المستخدم موجوداً، أو إنشائه إذا كان جديداً (Upsert)
        await User.findOneAndUpdate(
            { username: profileData.username }, 
            profileData, 
            { upsert: true, new: true }
        );

        res.status(200).json({ message: "تمت المزامنة بنجاح" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "خطأ أثناء المزامنة" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 خادم Nexus يعمل الآن على المنفذ ${PORT}`);
});
