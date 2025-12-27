import { translations } from './translations.js';
import { UI } from './ui.js';
import { PWA } from './pwa.js';
import { findRestaurant, reRoll, restoreSession, startSlotAnimation } from './api.js';
import { getEl } from './utils.js';

const App = {
    Config: {
        mins: parseInt(localStorage.getItem('currentMins') || '5'),
        includeClosed: localStorage.getItem('includeClosed') === 'true',
        get radius() { return this.mins * 80; },
        excluded: new Set(JSON.parse(localStorage.getItem('excludedTypes') || '[]')),
        prices: new Set(JSON.parse(localStorage.getItem('selectedPrices') || '["1","2","3","4"]')),
        lang: (function () {
            const params = new URLSearchParams(window.location.search);
            let lang = params.get('lang') || localStorage.getItem('preferredLang');

            if (lang) {
                if (lang.startsWith('zh')) lang = 'zh';
                if (lang.startsWith('ja')) lang = 'ja';
                if (['zh', 'en', 'ja'].includes(lang)) return lang;
            }

            const userLang = navigator.language || navigator.userLanguage;
            if (userLang.startsWith('ja')) return 'ja';
            if (userLang.startsWith('zh')) return 'zh';
            return 'en';
        })()
    },
    Data: {
        userPos: null,
        manualLocation: null,
        candidates: [],
        currentPlace: null,
        lastPickedId: null,
        history: [],
        params: new URLSearchParams(window.location.search)
    },
    UI: UI,
    PWA: PWA,
    translations: translations,
    get currentLang() { return this.Config.lang; },

    saveSettings() {
        localStorage.setItem('currentMins', this.Config.mins.toString());
        localStorage.setItem('includeClosed', this.Config.includeClosed);
        localStorage.setItem('selectedPrices', JSON.stringify(Array.from(this.Config.prices)));
        localStorage.setItem('excludedTypes', JSON.stringify(Array.from(this.Config.excluded)));
    },

    setLanguage(lang) {
        if (this.currentLang === lang) return;
        localStorage.setItem('preferredLang', lang);
        this.saveSettings();

        let url = window.location.pathname + '?lang=' + lang;
        if (!getEl('result-screen').classList.contains('hidden') && this.Data.lastPickedId) {
            url += '&resId=' + this.Data.lastPickedId;
            if (this.Data.userPos) url += `&lat=${this.Data.userPos.lat}&lng=${this.Data.userPos.lng}`;
        }
        window.location.href = url;
    },

    init() {
        this.UI.updateStrings(this);
        this.UI.initFilters(this);
        this.setupEventListeners();
        this.PWA.init(this.translations, this.currentLang);
        restoreSession(this);
        this.initLocationSearch();
    },

    async initLocationSearch() {
        const input = getEl('location-input');
        const bar = getEl('location-bar');
        const display = getEl('location-display');
        const clearBtn = getEl('clear-location');
        if (!input || !bar || !display || !clearBtn) return;

        const t = this.translations[this.currentLang];
        display.textContent = t.useCurrentLocation;

        // Toggle Logic
        bar.onclick = (e) => {
            if (e.target.closest('.clear-icon')) return;
            bar.classList.add('hidden');
            input.classList.remove('hidden');
            input.focus();
        };

        const resetToBar = () => {
            setTimeout(() => {
                input.classList.add('hidden');
                bar.classList.remove('hidden');
            }, 200);
        };

        input.onblur = resetToBar;

        // Clear Logic
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            this.Data.manualLocation = null;
            input.value = "";
            display.textContent = t.useCurrentLocation;
            clearBtn.classList.add('hidden');
            this.UI.triggerHaptic(30);
        };

        try {
            const { Autocomplete } = await google.maps.importLibrary("places");
            const autocomplete = new Autocomplete(input, {
                fields: ["geometry", "name"],
                types: ["geocode", "establishment"]
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                this.Data.manualLocation = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.name
                };

                display.textContent = "📍 " + place.name;
                clearBtn.classList.remove('hidden');
                input.value = place.name;
                resetToBar();
                this.UI.triggerHaptic(50);
            });
        } catch (e) {
            console.error("Autocomplete init failed:", e);
        }
    },

    setupEventListeners() {
        // App buttons
        const findBtn = getEl('find-btn');
        if (findBtn) findBtn.onclick = () => findRestaurant(this);

        const retryBtn = getEl('retry-btn');
        if (retryBtn) retryBtn.onclick = () => reRoll(this);

        const shareBtn = getEl('share-btn');
        if (shareBtn) shareBtn.onclick = () => this.UI.shareCurrentPlace(this);

        const backBtn = getEl('back-btn');
        if (backBtn) backBtn.onclick = () => this.UI.showScreen('main-flow');

        // Language selectors
        document.querySelectorAll('.lang-selector span').forEach(span => {
            span.onclick = () => this.setLanguage(span.dataset.lang);
        });

        // Distance Slider
        const slider = getEl('distance-slider');
        if (slider) {
            slider.value = this.Config.mins;
            slider.oninput = function () {
                const mins = parseInt(this.value);
                App.Config.mins = mins;
                getEl('distance-val').textContent = mins;
                App.saveSettings();
                App.UI.triggerHaptic(10);
            };
        }

        const includeClosedBtn = getEl('include-closed-btn');
        if (includeClosedBtn) {
            includeClosedBtn.onclick = () => {
                App.Config.includeClosed = !App.Config.includeClosed;
                App.saveSettings();
                App.UI.updateStrings(App); // Re-render to update class and text
                App.UI.triggerHaptic(30);
            };
        }
    }
};

// Expose globally
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

export default App;
