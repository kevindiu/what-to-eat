import { getEl } from './utils.js';

export const UI = {
    showScreen(screenId) {
        ['main-flow', 'result-screen', 'loading-screen'].forEach(id => {
            const el = getEl(id);
            if (el) el.classList.add('hidden');
        });
        const target = getEl(screenId);
        if (target) target.classList.remove('hidden');
    },

    updateStrings(App) {
        const t = App.translations[App.currentLang];
        getEl('app-title').textContent = t.title;
        getEl('app-subtitle').textContent = t.subtitle;
        getEl('distance-title').innerHTML = `${t.distanceTitle} (<span id="distance-val">${App.Config.mins}</span> mins)`;
        getEl('price-title').textContent = t.priceTitle;
        getEl('filter-title').textContent = t.filterTitle;
        getEl('find-btn').textContent = t.findBtn;
        getEl('retry-btn').textContent = t.retry;
        getEl('back-btn').textContent = t.backBtn;
        getEl('loading-text').textContent = t.loading;
        if (getEl('open-maps-btn')) getEl('open-maps-btn').textContent = t.openMaps;
        if (getEl('install-btn')) getEl('install-btn').textContent = t.installBtn;

        document.querySelectorAll('.lang-selector span').forEach(span => {
            span.classList.toggle('active', span.dataset.lang === App.currentLang);
        });
    },

    initFilters(App) {
        const list = getEl('filter-list');
        if (list) {
            list.innerHTML = '';
            const cats = App.translations[App.currentLang].categories;
            Object.keys(cats).forEach(id => {
                const div = document.createElement('div');
                div.className = 'filter-item' + (App.Config.excluded.has(id) ? ' active' : '');
                div.textContent = cats[id];
                div.onclick = () => {
                    div.classList.toggle('active');
                    if (App.Config.excluded.has(id)) App.Config.excluded.delete(id);
                    else App.Config.excluded.add(id);
                    App.saveSettings();
                    this.triggerHaptic(30);
                };
                list.appendChild(div);
            });
        }

        document.querySelectorAll('.price-item').forEach(item => {
            const p = item.dataset.price;
            item.classList.toggle('active', App.Config.prices.has(p));
            item.onclick = () => {
                item.classList.toggle('active');
                if (App.Config.prices.has(p)) App.Config.prices.delete(p);
                else App.Config.prices.add(p);
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
