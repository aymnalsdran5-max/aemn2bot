const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const BOT_TOKEN = '8549143434:AAFqOee_MH3qFLF-AFy6dhs5uQlFPVTTCjY';
const CHANNEL_ID = '@aym_9';

app.post('/api/upload-apk', upload.single('apkFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'لم يتم اختيار ملف' });
        }

        const formData = new FormData();
        formData.append('chat_id', CHANNEL_ID);
        formData.append('document', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype || 'application/vnd.android.package-archive'
        });

        const tgRes = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
            formData,
            { headers: formData.getHeaders() }
        );

        const fileId = tgRes.data.result.document.file_id;
        const fileInfoRes = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
        );
        const filePath = fileInfoRes.data.result.file_path;
        const directDownloadUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

        res.json({ success: true, apkUrl: directDownloadUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'خطأ أثناء الرفع لتيليجرام' });
    }
});

// تصدير التطبيق ليعمل بسلاسة على Vercel
module.exports = app;
