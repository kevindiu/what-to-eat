import { getEl } from './utils.js';
import { reRoll } from './api.js';
import { CUISINE_MAPPING, PLACE_FIELDS, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY } from './constants.js';
import confetti from 'canvas-confetti';



export const UI = {
    showScreen(screenId) {
        const screens = ['main-flow', 'result-screen', 'loading-screen'];
        screens.forEach(id => {
            const el = getEl(id);
            if (el) el.classList.toggle('hidden', id !== screenId);
        });

        // Footer Management
        const footerHome = getEl('footer-home');
        const footerResult = getEl('footer-result');
        const appFooter = getEl('app-footer');

        if (screenId === 'main-flow') {
            if (appFooter) appFooter.classList.remove('hidden');
            if (footerHome) footerHome.classList.remove('hidden');
            if (footerResult) footerResult.classList.add('hidden');
        } else if (screenId === 'result-screen') {
            if (appFooter) appFooter.classList.remove('hidden');
            if (footerHome) footerHome.classList.add('hidden');
            if (footerResult) footerResult.classList.remove('hidden');
        } else {
            // Loading screen or others - hide footer
            if (appFooter) appFooter.classList.add('hidden');
        }
    },

    updateStrings(App) {
        const t = App.translations[App.currentLang];
        const mappings = {
            'location-title': t.locationTitle,
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

        // Location specific updates
        const locInput = getEl('location-input');
        if (locInput) locInput.placeholder = t.searchPlaceholder;

        const locDisplay = getEl('location-display');
        if (locDisplay && !App.Data.manualLocation) {
            locDisplay.textContent = t.useCurrentLocation;
        }

        const distTitle = getEl('distance-title');
        if (distTitle) distTitle.innerHTML = `${t.distanceTitle} (<span id="distance-val">${App.Config.mins}</span> mins)`;

        const includeClosedBtn = getEl('include-closed-btn');
        if (includeClosedBtn) {
            const isActive = App.Config.includeClosed;
            includeClosedBtn.classList.toggle('active', isActive);

            const label = getEl('include-closed-label');
            if (label) {
                label.textContent = isActive ? t.includeClosed : t.excludeClosed;
            }
        }

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

    async showResult(App, place) {
        this.showScreen('result-screen');
        App.Data.lastPickedId = place.place_id;
        if (!App.Data.history) App.Data.history = [];
        if (!App.Data.history.includes(place.place_id)) {
            App.Data.history.push(place.place_id);
        }
        App.Data.currentPlace = place;

        const t = App.translations[App.currentLang];
        const el = {
            name: getEl('res-name'),
            rating: getEl('res-rating'),
            ratingCont: getEl('res-rating-container'),
            price: getEl('res-price'),
            priceCont: getEl('res-price-container'),
            cat: getEl('res-category'),
            catIcon: getEl('res-category-icon'),
            catCont: getEl('res-category-container'),
            hours: getEl('res-hours'),
            hoursCont: getEl('res-hours-container'),
            address: getEl('res-address'),
            mapCont: getEl('res-map-container'),
            phone: getEl('res-phone'),
            distance: getEl('res-distance'),
            distanceCont: getEl('res-distance-container'),
            mapsBtn: getEl('open-maps-btn')
        };

        // Text Content
        el.name.textContent = place.name;
        el.address.textContent = place.vicinity;
        getEl('result-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Rating
        const hasRating = typeof place.rating === 'number' && place.rating > 0;
        el.rating.textContent = hasRating ? place.rating : (t.ratingNew.replace(/⭐\s*/, ''));

        // Price
        const priceText = this.getPriceDisplay(place.priceLevel, t);
        el.price.textContent = priceText;
        el.priceCont.style.display = priceText ? 'flex' : 'none';

        // Category
        const catFull = this.getPlaceCategory(place, App);
        if (catFull) {
            const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
            el.catIcon.textContent = emojiMatch ? emojiMatch[1] : "🍴";
            el.cat.textContent = emojiMatch ? emojiMatch[2] : catFull;
            el.catCont.style.display = 'flex';
        } else el.catCont.style.display = 'none';

        // Opening Hours
        const todayHours = this.getTodayHours(place, App);
        el.hours.textContent = todayHours;
        el.hoursCont.style.display = todayHours ? 'flex' : 'none';

        // Distance
        if (place.durationText) {
            el.distance.textContent = place.durationText;
            el.distanceCont.style.display = 'flex';
        } else el.distanceCont.style.display = 'none';

        // Phone
        if (place.phone) {
            el.phone.textContent = `📞 ${place.phone}`;
            el.phone.href = `tel:${place.phone.replace(/\s+/g, '')}`;
            el.phone.style.display = ''; // Let CSS (.secondary-btn) handle display: flex
        } else el.phone.style.display = 'none';

        el.mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

        // Map logic
        this.renderMap(el.mapCont, place, App);

        this.triggerConfetti();
    },

    async renderMap(container, place, App) {
        if (!place.location) {
            container.style.display = 'none';
            return;
        }
        container.classList.add('skeleton');
        container.style.display = 'block';
        try {
            const [{ Map }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("marker")
            ]);

            const map = new Map(container, {
                center: place.location,
                zoom: 16,
                mapId: "DEMO_MAP_ID", // Required for AdvancedMarkerElement
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy',
                colorScheme: 'FOLLOW_SYSTEM'
            });

            // Restaurant Marker (Default Red Pin)
            const resMarker = new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.name
            });

            // User Location Marker (Custom Blue Dot)
            if (App.Data.userPos) {
                const userDot = document.createElement('div');
                userDot.style.width = '16px';
                userDot.style.height = '16px';
                userDot.style.backgroundColor = '#4285F4';
                userDot.style.border = '2px solid white';
                userDot.style.borderRadius = '50%';
                userDot.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';

                new AdvancedMarkerElement({
                    map,
                    position: App.Data.userPos,
                    title: "Your Location",
                    content: userDot
                });

                const bounds = new google.maps.LatLngBounds();
                bounds.extend(place.location);
                bounds.extend(App.Data.userPos);
                map.fitBounds(bounds, 50);
            }

            google.maps.event.addListenerOnce(map, 'idle', () => container.classList.remove('skeleton'));
        } catch (e) {
            console.error("Map Render Error:", e);
            container.style.display = 'none';
        }
    },

    startSlotAnimation(App) {
        const slotName = getEl('slot-name');
        let count = 0;
        const interval = setInterval(() => {
            const temp = App.Data.candidates[Math.floor(Math.random() * App.Data.candidates.length)];
            slotName.textContent = temp?.name || "...";
            if (++count > 15) {
                clearInterval(interval);
                reRoll(App);
            }
        }, 100);
    },

    getPlaceCategory(place, App) {
        const t = App.translations[App.currentLang].categories;
        const name = (place.name || "").toLowerCase();
        const types = place.types || [];
        for (const [id, keywords] of Object.entries(CUISINE_MAPPING)) {
            if (keywords.some(k => name.includes(k) || types.some(pt => pt.toLowerCase().includes(k)))) return t[id];
        }
        return null;
    },

    getPriceDisplay(level, t) {
        if (level === undefined || level === null) return "";
        let key = level;
        if (PRICE_VAL_TO_KEY[key]) key = PRICE_VAL_TO_KEY[key];
        const config = PRICE_LEVEL_MAP[key];
        return config ? config.label(t) : "";
    },

    getTodayHours(place, App) {
        const descriptions = place.openingHours?.weekdayDescriptions;
        if (!descriptions || descriptions.length !== 7) return "";
        const today = new Date();
        const mapLangMap = { 'zh': 'zh-HK', 'en': 'en-US', 'ja': 'ja-JP' };
        const appLocale = mapLangMap[App.currentLang] || 'zh-HK';
        const localeDayName = today.toLocaleDateString(appLocale, { weekday: 'long' });
        const enDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

        let match = descriptions.find(d => d.includes(localeDayName) || d.includes(enDayName));
        if (!match) match = descriptions[today.getDay()];
        if (match) {
            const parts = match.split(/: |：/);
            return parts[1] ? parts[1].trim() : match;
        }
        return "";
    },

    triggerHaptic(duration) {
        if (navigator.vibrate) navigator.vibrate(duration || 30);
    },

    triggerConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff6b81', '#ffd32a', '#2ecc71', '#3498db']
        });
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
