# راه‌اندازی ورود با Google در CODNAME

این پروژه کد `signInWithOAuth({ provider: "google" })` را دارد. برای فعال‌شدن خود Provider باید یک OAuth Client در Google Cloud بسازی و مشخصات آن را در Supabase وارد کنی.

## 1) ساخت پروژه در Google Cloud

1. وارد Google Cloud Console شو.
2. یک Project جدید بساز یا یک Project موجود را انتخاب کن.
3. از منوی اصلی برو به **Google Auth Platform**.
4. بخش **Branding** را کامل کن: نام برنامه را `CODNAME` بگذار و اطلاعات لازم را ثبت کن.
5. در بخش **Audience** نوع دسترسی را مطابق حسابت تنظیم کن.
6. در بخش **Data Access / Scopes** این scopeهای پایه را نگه دار:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`

## 2) ساخت Web OAuth Client

1. به بخش **Clients** برو.
2. **Create client** را بزن.
3. Application type را **Web application** انتخاب کن.
4. یک نام مثل `CODNAME Web` بده.
5. در **Authorized JavaScript origins** آدرس سایت بازی را وارد کن.
6. در **Authorized redirect URIs** آدرس callback پروژه Supabase را وارد کن.

برای پروژه CODNAME callback معمولاً این است:

`https://neqxfgjmoatdsglpixtc.supabase.co/auth/v1/callback`

7. **Create** را بزن.
8. **Client ID** و **Client Secret** را کپی کن.

## 3) فعال‌کردن Google در Supabase

1. وارد پروژه CODNAME در Supabase شو.
2. از نوار سمت چپ برو به **Authentication**.
3. وارد **Providers** شو.
4. **Google** را باز کن.
5. گزینه Google را **Enabled** کن.
6. مقدار **Client ID** گوگل را وارد کن.
7. مقدار **Client Secret** گوگل را وارد کن.
8. **Save** را بزن.

## 4) تنظیم Redirect URL در Supabase

از بخش Authentication به **URL Configuration** برو.

در قسمت **Redirect URLs** آدرس واقعی سایت CODNAME را اضافه کن.

برای GitHub Pages باید آدرس دقیق Pageای که بازی از آن باز می‌شود را اضافه کنی. نمونه:

`https://aazad1389a.github.io/codname/`

اگر در زمان توسعه از localhost استفاده می‌کنی، همان آدرس localhost را نیز اضافه کن، مثل:

`http://localhost:5500/`

## 5) تست

بعد از Save:

1. صفحه CODNAME را با Ctrl+F5 تازه‌سازی کن.
2. روی **ورود / ساخت حساب** بزن.
3. روی **ورود با Google** بزن.
4. حساب Google را انتخاب کن.
5. باید بعد از برگشت به CODNAME، نام کاربر در پروفایل نمایش داده شود.

## اگر خطای Provider not enabled دیدی

یعنی Google در Supabase فعال نشده یا Save نشده است.

## اگر خطای redirect دیدی

Callback در Google Cloud و Redirect URL در Supabase را دقیقاً بررسی کن؛ حتی یک تفاوت کوچک در آدرس باعث شکست OAuth می‌شود.

## برای Android و iOS

برای بسته‌های native باید علاوه بر Web Client، در Google Cloud یک OAuth Client جداگانه برای Android و یک Client برای iOS بسازی. برای Android اطلاعات SHA-1 signing certificate لازم است. Client IDهای لازم باید در Provider Google پروژه Supabase ثبت شوند.

## نکته امنیتی

Client Secret فقط در Google Cloud و Supabase نگهداری می‌شود. آن را داخل JavaScript، GitHub یا Frontend قرار نده.
