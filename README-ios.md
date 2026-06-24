# iOS app

`ios/` is a thin [Capacitor](https://capacitorjs.com) wrapper, not a port of
the app. It doesn't bundle the Next.js frontend — there's no fixed backend to
point at, since this is meant to be self-hosted. Instead it ships a tiny
bootstrap screen (`ios-shell/www/`) that asks for the address of *your*
server, then hands the WKWebView off to it. From that point on you're using
the same app as in a browser, just running fullscreen with a few native
extras layered in:

- A picker to import a client `.p12` certificate into the Keychain, for
  servers locked down with [mTLS](README.md#locking-down-access-with-nginx--mtls).
- That certificate gets presented automatically when the server challenges
  for it (`ServerConfigPlugin.handleWKWebViewURLAuthenticationChallenge`).
- Camera access for barcode scanning and document photo capture inside the
  WebView (same feature as the web app, just with the iOS permission prompt
  wired up).

**Status: written, not built.** This was developed in a Linux environment
with no Xcode, no macOS, and no Apple Developer account — every file below
was hand-verified against Capacitor's actual iOS framework source, but none
of it has been compiled, run in Simulator, or run on a device. Treat it as a
first draft to open in Xcode and shake out, not a finished build.

## Building it

Requires a Mac with Xcode (15+) and, for running on a real device or
submitting to the App Store, an Apple Developer account.

```bash
npm install
npx cap sync ios   # re-copies ios-shell/www and regenerates ios/App/App/public + capacitor.config.json
open ios/App/App.xcodeproj
```

In Xcode: pick a Signing Team under App target → Signing & Capabilities, pick
a simulator or device, and Run. The project uses Swift Package Manager for
Capacitor's dependencies (no CocoaPods/`pod install` step).

If you add or rename Swift files under `ios/App/App/`, note this project
uses the older Xcode project format (explicit file references, not
file-system-synchronized groups) — Xcode will offer to add new files to the
target when you create them from within Xcode, but files dropped in from
outside Xcode won't be picked up automatically.

## How the connect flow works

1. First launch shows `ios-shell/www/index.html` — a form for the server
   address, plus a button to import a `.p12`.
2. Submitting the form calls the native `ServerConfig.setServerUrl` plugin
   method (`ios/App/App/ServerConfigPlugin.swift`), which saves the address
   to `UserDefaults` and restarts the bridge (`MainViewController.swift`).
   The restart is necessary, not cosmetic: Capacitor only allows the WebView
   to navigate in-app to hosts listed in `allowedNavigationHostnames`, and
   that list is locked in when the bridge is created — it can't be mutated
   for a running bridge. `MainViewController.instanceDescriptor()` reads the
   saved URL and adds its host to that list, so the fresh bridge created by
   the restart allows navigating there. (The alternative — allow-listing
   `*` — was deliberately avoided: it would let *any* site the WebView ever
   loads call native plugins, including certificate import.)
3. On every launch, `ios-shell/www/app.js` checks for a saved server URL via
   `ServerConfig.getServerUrl` and redirects straight there if one exists, so
   the bootstrap screen is normally only seen once.
4. If the navigation to the saved server fails (DNS, TLS, timeout, etc.),
   Capacitor's `server.errorPath` config bounces the WebView back to
   `index.html`. `app.js` leaves itself a short-lived `localStorage`
   breadcrumb before each attempt so it can tell "just failed" apart from "a
   normal fresh launch" and show an error instead of looping forever.

## Importing a client certificate

Tap "Import client certificate (.p12)" on the bootstrap screen (it's only
shown there — there's currently no in-app way to re-import after connecting,
so import the cert before or right after entering the server address). This
opens the Files app picker, prompts for the `.p12` password, and stores the
resulting identity in the Keychain (`ClientCertManager.swift`). It's looked
up automatically the next time the server sends a client-certificate
challenge.

## Info.plist / permissions

- `NSCameraUsageDescription` — barcode scanning and document photo capture.
- `NSPhotoLibraryUsageDescription` — attaching existing photos to contracts/documents.
- No App Transport Security exceptions are configured, intentionally: the
  server address this app connects to should be HTTPS (the mTLS setup in the
  main README requires it). If you need to test against a plain-HTTP LAN
  server, that's a local `NSAppTransportSecurity` exception you'd add
  yourself — don't ship that to the App Store.

## App Store review

Apple's Guideline 4.2 (Minimum Functionality) is the main risk for any
"points at your own server" app — reviewers sometimes reject bare website
wrappers. This app has real native functionality beyond rendering a page
(camera/barcode scanning, file uploads, client-certificate import, a
configurable connection flow), which is the same pattern Home Assistant,
Nextcloud, and Immich's iOS apps use successfully. Worth having a TestFlight
build ready and a short explanation of the self-hosted model in the App
Review notes if asked.

## Known gaps / follow-ups

- No way to change the configured server URL from within the app once
  connected (short of deleting and reinstalling, or driving
  `ServerConfig.setServerUrl`/`clearServerUrl` from somewhere new). The
  storage key (`UserDefaults` key `server_url`) was deliberately chosen to
  also be readable/writable from an iOS Settings.bundle (`Settings >
  Contracts`), which would be the natural place to add a "change server" /
  "forget server" control — not yet implemented.
- No app icon / launch screen assets beyond Capacitor's template defaults.
- Android was not evaluated or built.
