import { translations } from './translations.js';
import { UI } from './ui.js';
import { PWA } from './pwa.js';
import { findRestaurant, reRoll, restoreSession, startSlotAnimation } from './api.js';
import { getEl } from './utils.js';

const App = {
    Config: {
        mins: parseInt(localStorage.getItem('currentMins') || '5'),
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
        this.PWA.init(this.translations, this.currentLang);
        restoreSession(this);
        this.initLocationSearch();
    },

    async initLocationSearch() {
        const input = getEl('location-input');
        const gpsBtn = getEl('gps-btn');
        if (!input || !gpsBtn) return;

        try {
            const { Autocomplete } = await google.maps.importLibrary("places");
            const autocomplete = new Autocomplete(input, {
                fields: ["geometry", "name"],
                types: ["geocode", "establishment"]
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) {
                    return; // User entered name but didn't select suggestion
                }

                this.Data.manualLocation = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    name: place.name
                };

                input.value = "📍 " + place.name;
                this.UI.triggerHaptic(50);
            });

            gpsBtn.onclick = () => {
                this.Data.manualLocation = null;
                input.value = "";
                this.UI.triggerHaptic(30);
            };
        } catch (e) {
            console.error("Autocomplete init failed:", e);
        }
    }
};

// Expose globally
window.App = App;
window.setLanguage = (lang) => App.setLanguage(lang);

document.addEventListener('DOMContentLoaded', () => {
    getEl('find-btn').onclick = () => findRestaurant(App);
    getEl('retry-btn').onclick = () => {
        // Direct re-roll without loading screen as requested
        reRoll(App);
    };
    getEl('share-btn').onclick = () => App.UI.shareCurrentPlace(App);
    getEl('back-btn').onclick = () => App.UI.showScreen('main-flow');

    const slider = getEl('distance-slider');
    if (slider) {
        slider.value = App.Config.mins;
        slider.oninput = function () {
            const mins = parseInt(this.value);
            App.Config.mins = mins;
            getEl('distance-val').textContent = mins;
            App.saveSettings();
            App.UI.triggerHaptic(10);
        };
    }
    App.init();
});

export default App;
