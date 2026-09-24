# BoardQuest 2027 — Gamified CBSE Class 10 Study Planner 🛡️

A gamified, offline-first CBSE Class 10 PWA study quest and timetable companion running from October 1, 2026 to March 31, 2027.

---

## 🚀 Quick Start (No VS Code Errors)

When cloning or downloading this project, follow these two simple steps:

### 1. Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```
> **Note for VS Code:** If you see red underlines or "Cannot find module" errors, it simply means `npm install` hasn't been run yet to download the local package types! Once `npm install` finishes, all type declarations will resolve automatically.

### 2. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Building for Production / GitHub Pages

### Why did previous builds show a blank page on GitHub Pages?
1. **Relative Asset Paths:** Standard Vite apps default to absolute paths (`/assets/index.js`). When deployed on GitHub Pages (`https://username.github.io/repository-name/`), the browser searches the root domain and receives a 404, causing a blank screen. This repository is pre-configured with `base: './'` in `vite.config.ts`, so assets load correctly on any domain, subfolder, or hosting provider.
2. **Raw `.tsx` vs Compiled Output:** Browsers cannot run TypeScript `.tsx` files directly. GitHub Pages must serve the compiled `dist/` bundle.

### Deploying to GitHub Pages (Automatic)
This repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`):
1. Push your code to your GitHub repository on `main` (or `master`).
2. Go to **Settings** > **Pages** in your GitHub repository.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. GitHub will automatically build and publish your site with zero manual steps!

### Manual Production Build
To test the production build locally:
```bash
# 1. Build the production package
npm run build

# 2. Preview the production build
npm run preview
```

---

## 📋 Available Scripts

- `npm run dev`: Starts local Vite dev server on port 3000.
- `npm run build`: Compiles TypeScript and creates optimized PWA assets in `dist/`.
- `npm run preview`: Previews the compiled `dist/` locally.
- `npm run lint`: Verifies TypeScript types without emitting code (`tsc --noEmit`).
