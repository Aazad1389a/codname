# 🃏 CODNAME

**CODNAME** یک بازی کارتی آنلاین، سریع و رقابتی است که با تمرکز روی بازی چندنفره، همکاری تیمی، تصمیم‌گیری و ارتباط بین بازیکنان طراحی شده است.

هدف پروژه ساخت یک تجربه‌ی ساده اما حرفه‌ای برای بازی در مرورگر است؛ بدون نیاز به نصب برنامه و با امکان ایجاد اتاق، دعوت بازیکنان، انجام بازی به‌صورت Real-Time و ذخیره اطلاعات بازیکنان.

---

## 🎮 درباره بازی

در CODNAME بازیکنان وارد یک اتاق آنلاین می‌شوند و در قالب تیم‌ها با یکدیگر رقابت می‌کنند.

هر بازی شامل مجموعه‌ای از کارت‌هاست که هرکدام دارای یک کلمه یا مفهوم هستند. بازیکنان باید با استفاده از سرنخ‌ها و انتخاب‌های هوشمندانه، کارت‌های مناسب را پیدا کنند و امتیاز بیشتری برای تیم خود به دست آورند.

سیستم بازی به شکلی طراحی شده که نتیجه فقط به شانس وابسته نباشد؛ بلکه **تصمیم‌گیری، همکاری و شناخت الگوها** نقش اصلی را داشته باشند.

### هدف اصلی

🏆 تیمی که بتواند زودتر به امتیاز موردنظر برسد، برنده مسابقه خواهد بود.

---

## 🌐 بازی آنلاین

CODNAME از ابتدا با هدف Multiplayer طراحی شده است.

بازیکنان می‌توانند:

* 🏠 اتاق جدید ایجاد کنند
* 🔑 با کد اتاق وارد بازی شوند
* 👥 بازیکنان دیگر را به اتاق دعوت کنند
* 🔴🔵 به تیم‌ها تقسیم شوند
* 🔄 تغییرات بازی را به‌صورت لحظه‌ای دریافت کنند
* ⏱️ نوبت هر بازیکن را مشاهده کنند
* 🏆 نتیجه مسابقه را مشاهده کنند
* 📊 آمار مسابقات خود را ذخیره کنند

سیستم Real-Time باعث می‌شود وضعیت اتاق و بازی بین بازیکنان هماهنگ باقی بماند.

---

## ✨ ویژگی‌های اصلی

### 🃏 سیستم کارت

کارت‌ها هسته اصلی بازی هستند.

هر کارت می‌تواند شامل:

* عنوان
* کلمه
* وضعیت کارت
* تیم مربوطه
* وضعیت انتخاب‌شدن
* انیمیشن Reveal

باشد.

طراحی کارت‌ها به‌صورت اختصاصی برای CODNAME انجام می‌شود و پروژه از Assetهای کپی‌شده از بازی‌های دیگر استفاده نمی‌کند.

---

### 👥 Multiplayer

سیستم Multiplayer برای پشتیبانی از چند بازیکن هم‌زمان طراحی شده است.

هر اتاق می‌تواند بین **۲ تا ۸ بازیکن** داشته باشد.

اطلاعاتی مانند:

* ورود و خروج بازیکنان
* تیم بازیکن
* امتیاز
* نوبت فعلی
* وضعیت بازی
* وضعیت کارت‌ها

در سمت سرور ذخیره و بین کاربران Synchronize می‌شود.

---

### 🏠 Room System

هر بازی دارای یک Room اختصاصی است.

ساختار اتاق:

```text
Create Room
     ↓
Room Code
     ↓
Join Players
     ↓
Team Assignment
     ↓
Game Start
     ↓
Real-Time Match
     ↓
Winner
```

هر اتاق دارای یک کد کوتاه و منحصر‌به‌فرد است که بازیکنان می‌توانند از طریق آن وارد مسابقه شوند.

---

## 🧠 سیستم نوبت

بازی دارای Turn System است.

در هر لحظه مشخص است:

* نوبت کدام تیم است
* بازیکن فعال چه کسی است
* چه کاری امکان‌پذیر است
* چه زمانی نوبت تمام می‌شود
* نوبت بعدی چه کسی خواهد بود

تمام تغییرات مهم بازی باید توسط سیستم اعتبارسنجی شوند تا بازیکن نتواند به‌صورت غیرمجاز state بازی را تغییر دهد.

---

## ⭐ XP و Level

CODNAME دارای سیستم پیشرفت بازیکن است.

بازیکنان با انجام مسابقات XP دریافت می‌کنند.

نمونه ساختار:

```text
Level 1
  ↓
XP
  ↓
Level 2
  ↓
XP
  ↓
Level 3
  ↓
...
```

اطلاعاتی مانند:

* Level
* XP
* Games Played
* Games Won

در پروفایل بازیکن ذخیره می‌شود.

این سیستم در آینده می‌تواند برای Unlock کردن امکانات ظاهری و شخصی‌سازی نیز گسترش پیدا کند.

---

## 🏆 Leaderboard

سیستم Leaderboard امکان مقایسه عملکرد بازیکنان را فراهم می‌کند.

رتبه‌بندی می‌تواند بر اساس معیارهایی مانند:

* تعداد برد
* تعداد بازی
* XP
* Level
* Win Rate

انجام شود.

هدف Leaderboard ایجاد رقابت سالم بین بازیکنان است.

---

# ☁️ Supabase

Backend پروژه با **Supabase** ساخته شده است.

Supabase وظیفه مدیریت بخش‌هایی مانند:

* Authentication
* PostgreSQL Database
* Realtime
* Player Profiles
* Rooms
* Matches
* Player Statistics

را بر عهده دارد.

### Database

ساختار اصلی دیتابیس شامل جدول‌های زیر است:

```text
profiles
rooms
room_players
matches
match_players
```

### profiles

اطلاعات دائمی بازیکن:

```text
id
username
avatar_url
xp
level
games_played
games_won
created_at
updated_at
```

### rooms

اطلاعات اتاق:

```text
id
code
host_id
status
max_players
current_turn
turn_team
game_state
winner_team
created_at
updated_at
```

### room_players

بازیکنان حاضر در اتاق:

```text
room_id
user_id
display_name
team
is_host
score
joined_at
last_seen_at
```

### matches

تاریخچه مسابقات:

```text
id
room_id
winner_team
red_score
blue_score
started_at
finished_at
created_at
```

### match_players

آمار بازیکنان هر مسابقه:

```text
match_id
user_id
team
score
```

---

## 🔐 امنیت

امنیت دیتابیس یکی از بخش‌های اصلی معماری CODNAME است.

جدول‌های اصلی با **Row Level Security (RLS)** محافظت می‌شوند تا کاربران فقط بتوانند داده‌هایی را مشاهده یا تغییر دهند که مجاز به دسترسی به آن‌ها هستند.

اعتبارسنجی عملیات حساس نیز باید در سمت Backend انجام شود.

اطلاعات محرمانه مانند:

```text
service_role_key
private server secrets
```

هرگز نباید داخل Frontend یا Repository عمومی قرار بگیرند.

---

# 🎨 طراحی رابط کاربری

CODNAME دارای رابط کاربری مدرن و واکنش‌گرا خواهد بود.

تمرکز طراحی روی:

* Dark UI
* کارت‌های زیبا
* انیمیشن‌های نرم
* افکت‌های Hover
* نمایش واضح تیم‌ها
* نمایش وضعیت نوبت
* نمایش امتیاز
* Room Code
* Player List
* Responsive Design

است.

رابط کاربری باید روی:

```text
Desktop
Tablet
Mobile
```

قابل استفاده باشد.

---

# ⚡ Performance

پروژه با هدف اجرای روان در مرورگرهای معمولی ساخته می‌شود.

اصول اصلی Performance:

* JavaScript ماژولار
* کاهش درخواست‌های غیرضروری
* مدیریت صحیح Realtime subscriptions
* جلوگیری از Renderهای اضافی
* Assetهای سبک
* استفاده از SVG برای بعضی عناصر گرافیکی
* Lazy Loading در صورت نیاز

---

# 🧩 معماری پروژه

ساختار پیشنهادی پروژه:

```text
CODNAME/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── main.js
│   ├── game.js
│   ├── cards.js
│   ├── multiplayer.js
│   ├── player.js
│   ├── ui.js
│   └── supabase.js
│
├── assets/
│   ├── cards/
│   ├── icons/
│   └── backgrounds/
│
├── supabase/
│   └── schema.sql
│
├── .github/
│   └── workflows/
│       └── pages.yml
│
└── README.md
```

هدف این ساختار جدا کردن منطق بازی، رابط کاربری، Multiplayer، کارت‌ها و Backend است تا توسعه پروژه در آینده ساده‌تر شود.

---

# 🚀 Deployment

Frontend پروژه برای اجرا روی **GitHub Pages** طراحی می‌شود.

معماری کلی:

```text
Player
   │
   ▼
GitHub Pages
   │
   ├── HTML
   ├── CSS
   └── JavaScript
          │
          ▼
       Supabase
          │
     ┌────┼────┐
     ▼    ▼    ▼
 Database Realtime Auth
```

این معماری باعث می‌شود Frontend به‌صورت Static روی GitHub Pages اجرا شود و قابلیت‌های آنلاین توسط Supabase مدیریت شوند.

---

# 🛠️ تکنولوژی‌ها

CODNAME از تکنولوژی‌های سبک و مناسب Web استفاده می‌کند:

* HTML5
* CSS3
* JavaScript
* Supabase
* PostgreSQL
* Supabase Realtime
* Supabase Auth
* GitHub
* GitHub Pages

در صورت نیاز، قابلیت‌های جدید بدون وابستگی سنگین به Frameworkهای بزرگ به پروژه اضافه خواهند شد.

---

# 🗺️ Roadmap

### Phase 1 — Foundation

* [x] ایجاد Repository
* [x] ایجاد Supabase Project
* [x] طراحی Database
* [x] فعال‌سازی RLS
* [x] آماده‌سازی ساختار Backend

### Phase 2 — Frontend

* [ ] طراحی صفحه اصلی
* [ ] صفحه Login
* [ ] Player Profile
* [ ] Room Creation
* [ ] Join Room
* [ ] Lobby
* [ ] Card Board

### Phase 3 — Game System

* [ ] Card Engine
* [ ] Turn System
* [ ] Team System
* [ ] Score System
* [ ] Win Condition
* [ ] Game State Synchronization

### Phase 4 — Multiplayer

* [ ] Supabase Realtime
* [ ] Player Presence
* [ ] Reconnect System
* [ ] Room Synchronization
* [ ] Server Validation

### Phase 5 — Progression

* [ ] XP
* [ ] Level
* [ ] Player Statistics
* [ ] Match History
* [ ] Leaderboard

### Phase 6 — Polish

* [ ] Card Animations
* [ ] UI Animations
* [ ] Sound Effects
* [ ] Responsive Design
* [ ] Performance Optimization
* [ ] Mobile Optimization

---

# 🎯 هدف نهایی

هدف CODNAME ساخت یک بازی کارتی آنلاین است که:

**ساده باشد، سریع اجرا شود، ظاهر حرفه‌ای داشته باشد و Multiplayer واقعی ارائه دهد.**

این پروژه از یک بازی ساده کارتی شروع می‌شود، اما معماری آن به شکلی طراحی می‌شود که در آینده بتوان ویژگی‌های بیشتری مانند حالت‌های مختلف بازی، شخصی‌سازی، سیستم رتبه‌بندی، پروفایل‌های پیشرفته و امکانات اجتماعی را به آن اضافه کرد.

---

## 📜 License

این پروژه یک پروژه مستقل و اختصاصی است.

تمام کدها، طراحی‌ها و Assetهای اختصاصی پروژه باید تحت مجوز انتخاب‌شده توسط صاحب Repository استفاده شوند.

---

## 👤 Project

**CODNAME**

Online Multiplayer Card Game

Built with ❤️ using Web Technologies + Supabase
