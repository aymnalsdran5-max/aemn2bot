const fetch = require('node-fetch');
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, serverTimestamp } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyDujZqLLN3nfSybLKSJavNTSBG0Bv7Lq0U",
    authDomain: "aemnstore.firebaseapp.com",
    projectId: "aemnstore",
    storageBucket: "aemnstore.firebasestorage.app",
    messagingSenderId: "418588320744",
    appId: "1:418588320744:web:50749f1cd6e87e8c01ba5d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        return res.status(200).json({ status: 'Bot Webhook Server is Active and Ready!' });
    }

    try {
        const update = req.body;
        const message = update.channel_post || update.message;
        if (!message) {
            return res.status(200).json({ status: 'No message found, ignored.' });
        }

        const caption = message.caption || message.text || '';
        
        // 1. تحديد القسم تلقائياً
        let itemType = 'apk';
        if (caption.includes('#quran')) itemType = 'quran';
        else if (caption.includes('#bot')) itemType = 'bot';

        // 2. استخراج الاسم (#name)
        let nameMatch = caption.match(/#name\s+(.+)/i);
        let title = nameMatch ? nameMatch[1].trim() : (message.document ? message.document.file_name : 'تطبيق جديد');

        // 3. استخراج الإصدار (#sdar)
        let sdarMatch = caption.match(/#sdar\s+(.+)/i);
        let version = sdarMatch ? sdarMatch[1].trim() : 'v1.0';

        // 4. استخراج رابط الأيقونة (#icon)
        let iconMatch = caption.match(/#icon\s+(https?:\/\/[^\s]+)/i);
        let iconUrl = iconMatch ? iconMatch[1].trim() : "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg";

        // 5. استخراج المميزات والوصف (#mezat)
        let description = caption;
        if (caption.includes('#mezat')) {
            let parts = caption.split(/#mezat/i);
            description = parts[1] ? parts[1].replace('#apk', '').replace('#quran', '').replace('#bot', '').trim() : caption;
        }

        const token = process.env.TELEGRAM_BOT_TOKEN;
        let fileUrl = "";

        // استخراج رابط الملف المباشر (APK أو صوتي) ليبدأ التحميل في المتصفح فوراً
        if (message.document) {
            const resFile = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${message.document.file_id}`);
            const fileData = await resFile.json();
            if (fileData.ok) {
                fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
            }
        }

        // حفظ البيانات في الفايربيس
        await addDoc(collection(db, "apps"), {
            type: itemType,
            authorUid: 'telegram_bot_sync',
            title: title,
            version: version,
            size: message.document && message.document.file_size ? (Math.round(message.document.file_size / (1024 * 1024)) + ' MB') : 'مباشر',
            modFeatures: itemType === 'quran' ? 'تلاوة خاشعة' : 'نسخة معدلة ومفحوصة',
            iconUrl: iconUrl,
            apkUrl: fileUrl || iconUrl,
            description: description,
            downloads: 0,
            comments: [],
            createdAt: serverTimestamp()
        });

        return res.status(200).json({ success: true, message: 'Synced successfully with icon URL!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
};
