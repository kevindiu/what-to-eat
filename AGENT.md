# AI Agent Guidelines - What to Eat? 🍲 (v3.63)

This document serves as a technical context and set of instructions for any AI Agent working on the "What to Eat?" PWA project.

## 🌟 Project Identity
"What to Eat" (食乜好 / メシ決) is a sleek, mobile-first PWA designed to help users quickly decide on a restaurant based on their current location, walking distance preference, and cuisine cravings.

> [!IMPORTANT]
> **Branding**: The app title across all languages should NOT contain a question mark (e.g., "食乜好"). The Japanese title is specifically "**メシ決**".

## 🛠 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern features like backdrop-filter, glassmorphism), Vite (Bundler).
- **Logic**: Vanilla JavaScript (ESM Modules).
- **APIs**: Google Maps Platform (Maps, Places Library v3/v4, Distance Matrix).
- **PWA**: Vite PWA Plugin (`vite-plugin-pwa`).

## 🏗 Project Structure
-   **src/**: Source code (JS modules, CSS).
    -   `main.js`: App entry point.
    -   `style.css`: Stylesheet (imported in main.js).
-   **public/**: Static assets (icons, manifest.json).
-   **index.html**: Entry point.
-   **vite.config.js**: Build configuration.

## 🧠 Core Logic & Features
1. **Search Flow**: Fetches nearby restaurants, filters by price/cravings, calls Distance Matrix for exact walking minutes, and picks a winner.
2. **Session History (No-Repeat)**: 
   - `App.Data.history` tracks `place_id` of picked restaurants during a session.
   - `reRoll` (Retry) will prioritize restaurants not in history.
   - History resets whenever a fresh "Find Restaurant" search is triggered.
3. **Session Restoration**: Uses URL parameters (`placeId`, `lang`, `lat`, `lng`) to allow sharing and persistence.

## ⚠️ Workflow (Vite)
1.  **Development**: Run `npm run dev` for local server with Hot Module Replacement (HMR).
2.  **Build**: Run `npm run build` to generate `dist/`.
3.  **Deploy**: Upload `dist/` folder contents.
4.  **Versioning**: Done automatically by Vite (hashing). No manual versioning needed.
5.  **DOM Access**: Always use `getEl(id)` from `utils.js`.

---
*Maintained by Antigravity (Advanced Agentic Coding)*
