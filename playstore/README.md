# Play Store App Packaging

This repository now includes PWA assets and a Trusted Web Activity (TWA) reference for packaging the existing web app as an Android app.

## What is included

- `public/manifest.json` — Web App Manifest for installable PWA support.
- `public/service-worker.js` — Offline caching and basic navigation fallback.
- `public/.well-known/assetlinks.json` — Placeholder digital asset links for TWA verification.
- `.github/workflows/deploy-gh-pages.yml` — GitHub Pages deployment workflow.
- `playstore/twa-manifest.json` — Example TWA metadata to use when generating the Android wrapper.

## Steps to publish the website

1. Push the repository to GitHub.
2. Ensure the site builds successfully:
   - `npm install`
   - `npm run build`
3. The GitHub Pages workflow will deploy `dist/` to GitHub Pages on push to `main` or `master`.
4. Add a custom domain in GitHub Pages settings if needed.

## Steps to create the Android Play Store app

1. Host the website over HTTPS on a public domain.
2. Install Node.js, npm, and Android Studio.
3. Generate a TWA wrapper using Bubblewrap:
   - `npx @bubblewrap/cli init --manifest https://YOUR_DOMAIN/manifest.json`
   - `npx @bubblewrap/cli build`
4. Open the generated Android project in Android Studio and build an `AAB`.
5. In the Google Play Console, create a new application and upload the `AAB`.
6. After signing the app, update `public/.well-known/assetlinks.json` with the app's actual `package_name` and `sha256_cert_fingerprints`.

## Notes

- Play Store publication requires a Google Play Developer account.
- The website must be served via HTTPS for PWA and TWA support.
- Replace `com.earthgoods.app` with your real Android package name before publishing.
