# فعال‌سازی ورود با GitHub در CODNAME

کد بازی اکنون به‌جای Google از GitHub OAuth استفاده می‌کند.

## 1) ساخت OAuth App در GitHub

در GitHub برو به:

`Settings → Developer settings → OAuth Apps → New OAuth App`

مقادیر را این‌طور وارد کن:

**Application name**

`CODNAME`

**Homepage URL**

```text
https://aazad1389a.github.io/codname/
```

**Authorization callback URL**

```text
https://neqxfgjmoatdsglpixtc.supabase.co/auth/v1/callback
```

بعد `Register application` را بزن.

یک **Client ID** به تو می‌دهد. سپس `Generate a new client secret` را بزن و Secret را کپی کن.

## 2) فعال‌کردن GitHub در Supabase

در پروژه CODNAME برو به:

`Authentication → Providers → GitHub`

GitHub را فعال کن و این دو مقدار را وارد کن:

```text
Client ID     = GitHub OAuth Client ID
Client Secret = GitHub OAuth Client Secret
```

سپس `Save` را بزن.

## 3) URL تنظیمات Supabase

برو به:

`Authentication → URL Configuration`

در **Site URL**:

```text
https://aazad1389a.github.io/codname/
```

در **Redirect URLs** هم این را اضافه کن:

```text
https://aazad1389a.github.io/codname/
```

## 4) تست

صفحه CODNAME را با `Ctrl + Shift + R` باز کن.

پنجره ورود باید دکمه‌ی زیر را داشته باشد:

`ورود با GitHub`

با کلیک روی آن باید به GitHub بروی و سپس دوباره به CODNAME برگردی.

## نکته امنیتی

Client Secret فقط باید داخل Supabase قرار بگیرد. آن را داخل GitHub repository یا فایل JavaScript پروژه قرار نده.

کلاینت مرورگر CODNAME فقط از Supabase publishable key استفاده می‌کند.
