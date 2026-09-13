# CODNAME Mobile Build

CODNAME is prepared as a web-first app that can be packaged with Capacitor 8 for Android and iOS while keeping the same game UI and Supabase backend.

## Setup

```bash
npm install
npm run android:add
npm run ios:add
npm run cap:sync
```

Open the native projects with:

```bash
npm run android:open
npm run ios:open
```

Android requires Android Studio and a configured Android SDK. iOS requires macOS with Xcode.

## Google Login

The frontend already calls Supabase Auth with the `google` provider. The Google provider itself must be enabled in the Supabase Dashboard and supplied with the Google OAuth Client ID and Client Secret.

For the web app, add the production site origin to Google's authorized JavaScript origins and add the Supabase Auth callback URL as the authorized redirect URI. Supabase's current Google guide documents the provider setup and callback requirements.

For native builds, configure the platform-specific OAuth client IDs and app/deep-link redirect handling when the Android and iOS package identifiers are registered.

## GitHub Pages

The browser/PWA version remains the primary hosted build. The Capacitor projects are generated from the same web source, so gameplay and Supabase logic stay shared.
