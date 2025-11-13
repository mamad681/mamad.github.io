import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// پردازش JSON بزرگ تا Base64 عکس‌ها
app.use(express.json({ limit: "15mb" }));

// سرو کردن فایل‌های استاتیک
app.use(express.static(__dirname));

const photosDir = path.join(__dirname, "photos");
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir);

app.post("/send-sms", (req, res) => {
  try {
    console.log("دریافت شد:", Object.keys(req.body)); // لاگ کلیدهای دریافتی
    const { userName, answers, photos } = req.body;

    if (!userName || !answers || !photos) {
      console.log("داده ناقص است");
      return res.json({ ok: false, error: "داده ناقص است" });
    }

    const id = Date.now().toString();
    const dir = path.join(photosDir, id);
    fs.mkdirSync(dir);

    photos.forEach((p, i) => {
      const base64 = p.split(",")[1];
      fs.writeFileSync(path.join(dir, `photo_${i + 1}.jpg`), Buffer.from(base64, "base64"));
    });

    const fullData = { userName, answers };
    fs.writeFileSync(path.join(dir, "answers.json"), JSON.stringify(fullData, null, 2));

    console.log("ارسال پاسخ موفق");
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ ok: true }));

  } catch (err) {
    console.error("خطای سرور:", err);
    res.status(500).setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ ok: false, error: err.message }));
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

