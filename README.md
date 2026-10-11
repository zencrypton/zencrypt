# ZENCRYPT — Local File Vault

A zero-knowledge file vault that lives entirely in the browser.
Every file you seal is fingerprinted with **SHA-256** and written to
on-device **IndexedDB** storage — no accounts, no uploads, no servers.

## Live site (GitHub Pages)

The deployable website lives in [`docs/`](docs/) — no build step needed:

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `docs/index.html`             | Page markup (references the CSS/JS below)            |
| `docs/assets/css/style.css`   | Full site stylesheet — **not minified**              |
| `docs/assets/js/app.js`       | Vault logic: gate, cipher ring, IndexedDB, uploads   |
| `docs/assets/favicon.svg`     | Site icon                                            |
| `docs/assets/grain.svg`       | Standalone paper-grain source (CSS inlines it as a data-URI, so the page needs zero extra requests) |
| `docs/.nojekyll`              | Tells GitHub Pages to serve `assets/` as-is          |

### Publish in 3 steps

1. Push this folder to a GitHub repository.
2. Open **Settings → Pages → Build and deployment** and select:
   **Source: Deploy from a branch → Branch: `main` → Folder: `/docs`**.
3. Open the published URL — the vault works offline after first load
   (only external request is Google Fonts; see below).

### Preview locally

Any static server works, e.g. from the repo root:

```powershell
# Python
py -m http.server 8000
# then open http://localhost:8000/docs/
```

> `index.html.html` at the repo root is the original single-file source.
> `docs/` was split from it **byte-for-byte** (verified by round-trip check) —
> code and quality untouched, only the `<style>` / `<script>` blocks moved
> into `assets/css/style.css` and `assets/js/app.js`.

## How it works

- **Gate** — SHA-256 key check with a cipher-ring animation, attempts
  counter, lockout timer, and key show/hide.
- **Seal files** — click, drag & drop anywhere, or paste; files can be
  sealed before unlocking and appear after unlock.
- **Retrieve / purge** — download or delete records; ledger shows
  fingerprint, size, and seal date.
- **Sound design** — tiny WebAudio blips (off when reduced-motion is set).
- **Toasts, clocks, session ID, responsive layout** down to small phones.

## Privacy

- Storage: `IndexedDB` database `zencrypt`, store `files` — this browser only.
- Crypto: `SHA-256` via WebCrypto (FNV-1a fallback fingerprint).
- Network: none, except optional Google Fonts
  (`Instrument Serif` + `JetBrains Mono`). To go fully offline, download the
  `.woff2` files into `docs/assets/fonts/` and swap the `<link>` tags for
  `@font-face` rules.

## Repo layout

```text
ZENCRYPT.EXE/
├── README.md               ← you are here
├── index.html.html         ← original single-file source (kept, untouched)
├── favicon.svg / grain.svg ← asset sources (copied into docs/assets/)
├── style.css / app.js      ← earlier split pair (kept for reference)
├── docs/                   ← ★ GitHub Pages site (deploy this folder)
│   ├── index.html
│   ├── .nojekyll
│   └── assets/
│       ├── css/style.css
│       ├── js/app.js
│       ├── favicon.svg
│       └── grain.svg
├── zencrypt/               ← alternate theme experiment
└── zencrypt-docs/          ← alternate docs experiment
```
