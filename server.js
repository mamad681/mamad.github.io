import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// برای پردازش JSON بزرگ
app.use(express.json({ limit: "15mb" }));

// ✅ این خط مهمه تا فایل‌های html و css و js از همین پوشه سرو بشن
app.use(express.static(__dirname));

const photosDir = path.join(__dirname, "photos");
if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir);

app.post("/send-sms", (req, res) => {
  try {
    const { answers, photos } = req.body;
    if (!answers || !photos) return res.json({ ok: false, error: "داده ناقص است" });
    const id = Date.now().toString();
    const dir = path.join(photosDir, id);
    fs.mkdirSync(dir);
    photos.forEach((p, i) => {
      const base64 = p.split(",")[1];
      fs.writeFileSync(path.join(dir, `photo_${i + 1}.jpg`), Buffer.from(base64, "base64"));
    });
    fs.writeFileSync(path.join(dir, "answers.json"), JSON.stringify(answers, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
