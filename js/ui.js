import { getEl } from './utils.js';

export const UI = {
    showScreen(screenId) {
        const screens = ['main-flow', 'result-screen', 'loading-screen'];
        screens.forEach(id => {
            const el = getEl(id);
            if (el) el.classList.toggle('hidden', id !== screenId);
        });
    },

    updateStrings(App) {
        const t = App.translations[App.currentLang];
        const mappings = {
            'app-title': t.title,
            'app-subtitle': t.subtitle,
            'price-title': t.priceTitle,
            'filter-title': t.filterTitle,
            'find-btn': t.findBtn,
            'retry-btn': t.retry,
            'back-btn': t.backBtn,
            'loading-text': t.loading,
            'open-maps-btn': t.openMaps,
            'share-btn': t.shareBtn,
            'install-btn': t.installBtn
        };

        Object.entries(mappings).forEach(([id, text]) => {
            const el = getEl(id);
            if (el) el.textContent = text;
        });

        const distTitle = getEl('distance-title');
        if (distTitle) distTitle.innerHTML = `${t.distanceTitle} (<span id="distance-val">${App.Config.mins}</span> mins)`;

        document.querySelectorAll('.lang-selector span').forEach(span => {
            span.classList.toggle('active', span.dataset.lang === App.currentLang);
        });
    },

    initFilters(App) {
        const list = getEl('filter-list');
        if (!list) return;

        list.innerHTML = '';
        const cats = App.translations[App.currentLang].categories;

        Object.keys(cats).forEach(id => {
            const div = document.createElement('div');
            div.className = `filter-item ${App.Config.excluded.has(id) ? 'active' : ''}`;
            div.textContent = cats[id];
            div.onclick = () => {
                const isActive = div.classList.toggle('active');
                if (isActive) App.Config.excluded.add(id);
                else App.Config.excluded.delete(id);
                App.saveSettings();
                this.triggerHaptic(30);
            };
            list.appendChild(div);
        });

        document.querySelectorAll('.price-item').forEach(item => {
            const p = item.dataset.price;
            item.classList.toggle('active', App.Config.prices.has(p));
            item.onclick = () => {
                const isActive = item.classList.toggle('active');
                if (isActive) App.Config.prices.add(p);
                else App.Config.prices.delete(p);
                App.saveSettings();
                this.triggerHaptic(30);
            };
        });
    },

    triggerHaptic(duration) {
        if (navigator.vibrate) navigator.vibrate(duration || 30);
    },

    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#ff6b81', '#ffd32a', '#2ecc71', '#3498db']
            });
        }
    }
};
