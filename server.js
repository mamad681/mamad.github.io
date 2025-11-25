import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// سرویس دهی فایل‌های استاتیک بدون محدودیت
app.use(express.static(__dirname));

app.use(express.json({ limit: "50mb" }));

// Route اصلی
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API برای ارسال داده
const IMGBB_API_KEY = "2fe3007ea3853c345b114b7394111687";

app.post("/send-sms", async (req, res) => {
  try {
    const { name, answers, photos } = req.body;

    console.log("📥 دریافت داده‌های نظرسنجی:", {
      name,
      answerCount: Object.keys(answers).length,
      photoCount: photos.length
    });

    const uploadedUrls = [];

    // آپلود عکس‌ها به ImgBB
    for (const base64 of photos) {
      try {
        const imageData = base64.split(",")[1];
        const formData = new URLSearchParams();
        formData.append("key", IMGBB_API_KEY);
        formData.append("image", imageData);

        const result = await axios.post(
          "https://api.imgbb.com/1/upload",
          formData
        );
        uploadedUrls.push(result.data.data.url);
        console.log("✅ عکس آپلود شد:", result.data.data.url);
      } catch (imgError) {
        console.error("❌ خطا در آپلود عکس:", imgError.message);
        uploadedUrls.push(`خطا: ${imgError.message}`);
      }
    }

    console.log("📊 نتیجه نهایی:", {
      name,
      answers,
      uploadedUrls
    });

    return res.json({ 
      ok: true, 
      urls: uploadedUrls,
      message: "داده‌ها با موفقیت دریافت شد"
    });

  } catch (err) {
    console.error("❌ خطای سرور:", err.message);
    return res.json({ 
      ok: false, 
      error: err.message 
    });
  }
});

// Route تست سلامت
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "سرور در حال اجراست" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🚀 SERVER RUNNING - NO CSP RESTRICTIONS");
  console.log("📡 Port: " + PORT);
  console.log("🔗 URL: http://localhost:3000");
  console.log("🔗 Health: http://localhost:3000/health");
  console.log("=".repeat(50));
});