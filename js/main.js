import { translations } from './translations.js';
import { getEl, UI } from './ui.js';
import { PWA } from './pwa.js';
import { findRestaurant, reRoll, restoreSession } from './api.js';

const App = {
    Config: {
        mins: parseInt(localStorage.getItem('currentMins') || '5'),
        get radius() { return this.mins * 80; },
        excluded: new Set(JSON.parse(localStorage.getItem('excludedTypes') || '[]')),
        prices: new Set(JSON.parse(localStorage.getItem('selectedPrices') || '["1","2","3","4"]')),
        lang: (function () {
            const saved = localStorage.getItem('preferredLang');
            if (saved) return saved;
            const userLang = navigator.language || navigator.userLanguage;
            if (userLang.startsWith('ja')) return 'ja';
            if (userLang.startsWith('zh')) return 'zh';
            return 'en';
        })()
    },
    Data: {
        userPos: null,
        candidates: [],
        lastPickedId: null,
        params: new URLSearchParams(window.location.search)
    },
    UI: UI,
    PWA: PWA,
    translations: translations,
    currentLang: (function () {
        const saved = localStorage.getItem('preferredLang');
        if (saved) return saved;
        const userLang = navigator.language || navigator.userLanguage;
        if (userLang.startsWith('ja')) return 'ja';
        if (userLang.startsWith('zh')) return 'zh';
        return 'en';
    })(),

    saveSettings() {
        localStorage.setItem('currentMins', this.Config.mins.toString());
        localStorage.setItem('selectedPrices', JSON.stringify(Array.from(this.Config.prices)));
        localStorage.setItem('excludedTypes', JSON.stringify(Array.from(this.Config.excluded)));
    },

    setLanguage(lang) {
        if (this.Config.lang === lang) return;
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
        this.UI.updateStrings(this, this.translations, this.currentLang);
        this.UI.initFilters(this, this.translations, this.currentLang);
        this.PWA.init(this.translations, this.currentLang);
        restoreSession(this, this.translations, this.currentLang);
    }
};

// Expose setLanguage globally for the HTML onclick handlers
window.App = App;
window.setLanguage = (lang) => App.setLanguage(lang);

document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners
    getEl('find-btn').onclick = () => findRestaurant(App, App.translations, App.currentLang);
    getEl('retry-btn').onclick = () => reRoll(App, App.translations, App.currentLang);
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
