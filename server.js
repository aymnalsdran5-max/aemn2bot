const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { initializeApp } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');

initializeApp();
const bucket = getStorage().bucket();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-apk', upload.single('apkFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'لم يتم إرفاق ملف APK' });

        const fileName = `apks/${Date.now()}_${req.file.originalname}`;
        const fileRef = bucket.file(fileName);

        await fileRef.save(req.file.buffer, {
            metadata: { contentType: 'application/vnd.android.package-archive' },
            public: true
        });

        const apkUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        res.json({ success: true, apkUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = app;
