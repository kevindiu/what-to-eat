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
            'install-btn': t.installBtn,
            'location-title': t.locationTitle,
            'location-display': App.Data.manualPos ? App.Data.manualLocationName : t.currentLocation
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

    async initLocationPicker(App) {
        const bar = getEl('location-bar');
        const input = getEl('location-input');
        const display = getEl('location-display');
        const clear = getEl('clear-location');
        const t = App.translations[App.currentLang];

        if (!bar || !input) return;

        bar.onclick = () => {
            bar.classList.add('hidden');
            input.classList.remove('hidden');
            input.placeholder = t.searchHint;
            input.focus();
        };

        try {
            const { Autocomplete } = await google.maps.importLibrary("places");
            const autocomplete = new Autocomplete(input, {
                fields: ["formatted_address", "geometry", "name"],
                types: ["geocode", "establishment"]
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) return;

                App.Data.manualPos = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                };
                App.Data.manualLocationName = place.name || place.formatted_address;

                display.textContent = App.Data.manualLocationName;
                clear.classList.remove('hidden');

                input.classList.add('hidden');
                input.value = '';
                bar.classList.remove('hidden');
                this.triggerHaptic(50);
            });

            // Handle blur to go back if empty
            input.onblur = () => {
                if (!input.value) {
                    input.classList.add('hidden');
                    bar.classList.remove('hidden');
                }
            };

            clear.onclick = (e) => {
                e.stopPropagation();
                App.Data.manualPos = null;
                App.Data.manualLocationName = null;
                display.textContent = t.currentLocation;
                clear.classList.add('hidden');
                this.triggerHaptic(30);
            };

        } catch (e) { console.error("Autocomplete init failed", e); }
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
    },

    async shareCurrentPlace(App) {
        const place = App.Data.currentPlace;
        if (!place) return;
        const t = App.translations[App.currentLang];
        const shareUrl = `${window.location.origin}${window.location.pathname}?resId=${place.place_id}${App.Data.userPos ? `&lat=${App.Data.userPos.lat}&lng=${App.Data.userPos.lng}` : ''}`;
        const shareText = t.shareText.replace('${name}', place.name);

        if (navigator.share) {
            try {
                await navigator.share({ title: place.name, text: shareText, url: shareUrl });
            } catch (e) { console.log("Share failed", e); }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                const msg = App.currentLang === 'zh' ? "已複製連結到剪貼簿！📋" : App.currentLang === 'ja' ? "クリップボードにコピーしました！📋" : "Link copied to clipboard! 📋";
                alert(msg);
            } catch (e) { alert(shareUrl); }
        }
    }
};

export default UI;
