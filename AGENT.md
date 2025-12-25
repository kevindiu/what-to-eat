# AI Agent Guidelines - What to Eat? 🍲

This document serves as a technical context and set of instructions for any AI Agent working on the "What to Eat?" PWA project.

## 🌟 Project Identity
"What to Eat?" is a sleek, mobile-first PWA designed to help users quickly decide on a restaurant based on their current location, walking distance preference, and cuisine cravings.

## 🛠 Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (Modern features like backdrop-filter, flexbox, grid).
- **Logic**: Vanilla JavaScript (ESM Modules).
- **APIs**: Google Maps Platform (Maps, Places Library v3/v4, Distance Matrix).
- **PWA**: Service Workers (sw.js), Web Manifest (manifest.json).

## 🏗 Modular Architecture (`/js`)
The JS logic is strictly modularized:
- `main.js`: App initialization, global state management (`App` object), and event listeners.
- `api.js`: Google Maps API interactions, search logic, and `displayResult` UI population.
- `ui.js`: Screen management (show/hide), animations (Confetti), and generic UI state.
- `translations.js`: Centralized dictionary for Traditional Chinese (`zh`), English (`en`), and Japanese (`ja`).
- `utils.js`: Shared helper functions (`getEl`, `getCurrentPosition`, `sleep`).
- `pwa.js`: Service worker registration and installation prompt logic.
- `constants.js`: Cuisine mappings and other static configurations.

## 🧠 Core Logic: The Search Flow
The search process is optimized for **high-accuracy walking distance**:
1. **Nearby Search**: Fetches up to 20 restaurants using `searchNearby`.
2. **Filtering**: Filters by price, exclusion types, and distance (using a rough radius).
3. **Distance Matrix**: Calls the Distance Matrix API for the filtered candidates to get *exact* walking durations.
4. **Final Selection**: Picks a random restaurant that fits exactly within the user's selected minutes (e.g., 5, 10, 15, 30).
5. **Session Restoration**: Uses URL parameters (`placeId`, `lang`, `lat`, `lng`) to allow sharing results and persistence across reloads.

## 🎨 UI/UX Standards
- **Vertical Infographic Layout**: Metadata (Rating, Price, Category, Distance) must use the "Box" layout (Icon on top, value below).
- **Typography**: Uses Google Fonts (`Fredoka`, `Inter`).
- **Accessibility**: Use semantic HTML tags. Ensure interactive elements have sufficient tap targets.
- **Glassmorphism**: Cards should use `backdrop-filter: blur`, subtle borders, and soft shadows.

## ⚠️ Critical Rules for Agents
1. **No Hardcoded Strings**: All UI text must go in `js/translations.js`.
2. **Cache Busting**: Whenever modifying JS, CSS, or assets, increment the version number (`vX.XX`) in:
    - `index.html` (script/link tags)
    - `sw.js` (`CACHE_NAME`)
    - `js/pwa.js` (sw registration call)
3. **Async Integrity**: Always use `async/await` for API calls and UI sequences. Avoid callback hell.
4. **DOM Access**: Always use `getEl(id)` from `utils.js` instead of `document.getElementById`.
5. **Language Sanitization**: The `App.currentLang` must be one of `zh`, `en`, `ja`. Sanitize any input (like `zh-HK`) to these keys.

---
*Created by Antigravity (Advanced Agentic Coding)*
