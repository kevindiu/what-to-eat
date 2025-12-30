import { getEl, isPlaceMatch } from './utils.js';
import { reRoll } from './api.js';
import { CUISINE_MAPPING, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY, CONSTANTS } from './constants.js';
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
            'filter-title': App.Config.filterMode === 'whitelist' ? t.filterModeWhitelist : t.filterModeBlacklist,
            'find-btn': t.findBtn,
            'retry-btn': t.retry,
            'back-btn': t.backBtn,
            'loading-text': t.loading,
            'open-maps-btn': t.openMaps,
            'share-btn': t.shareBtn,
            'install-btn': t.installBtn,
            'reviews-title': t.reviews,
            'view-all-reviews': t.viewAllReviews,
            'photos-title': t.photosTitle,
            'view-all-photos': t.viewAllPhotos
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
        if (distTitle) {
            distTitle.textContent = "";
            distTitle.appendChild(document.createTextNode(`${t.distanceTitle} (`));
            const span = document.createElement('span');
            span.id = 'distance-val';
            span.textContent = App.Config.mins;
            distTitle.appendChild(span);
            distTitle.appendChild(document.createTextNode(' mins)'));
        }

        const includeClosedBtn = getEl('include-closed-btn');
        if (includeClosedBtn) {
            const isActive = App.Config.includeClosed;
            includeClosedBtn.classList.toggle('active', isActive);

            const label = getEl('include-closed-label');
            if (label) {
                label.textContent = isActive ? t.includeClosed : t.excludeClosed;
            }
        }

        const filterModeLabel = getEl('filter-mode-label');
        if (filterModeLabel) {
            filterModeLabel.textContent = App.Config.filterMode === 'whitelist' ? t.filterToggleBlacklist : t.filterToggleWhitelist;
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
                const currentlyExcluded = App.Config.excluded.has(id);
                if (currentlyExcluded) {
                    App.Config.excluded.delete(id);
                    div.classList.remove('active');
                } else {
                    App.Config.excluded.add(id);
                    div.classList.add('active');
                }
                App.saveSettings();
                this.triggerHaptic(CONSTANTS.HAPTIC_FEEDBACK_DURATION.SHORT);
            };
            list.appendChild(div);
        });

        document.querySelectorAll('.price-item').forEach(item => {
            const p = item.dataset.price;
            item.classList.toggle('active', App.Config.prices.has(p));
            item.onclick = () => {
                const currentlySelected = App.Config.prices.has(p);
                if (currentlySelected) {
                    App.Config.prices.delete(p);
                    item.classList.remove('active');
                } else {
                    App.Config.prices.add(p);
                    item.classList.add('active');
                }
                App.saveSettings();
                this.triggerHaptic(CONSTANTS.HAPTIC_FEEDBACK_DURATION.SHORT);
            };
        });
    },

    async showResult(App, place, options = {}) {
        const { fromShare = false } = options;
        this.showScreen('result-screen');

        App.Data.currentPlace = place;
        this.updateHistory(App, place);

        const el = this.getElements();

        // Sequential rendering for clarity and stability
        this.renderHeader(el, place, fromShare);
        this.renderPhotos(el, place);
        this.renderReviews(el, place);
        this.renderDetails(el, place, App);
        this.renderMap(el.mapCont, place, App);

        if (!fromShare) {
            this.triggerConfetti();
            const screen = getEl('result-screen');
            if (screen) screen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    updateHistory(App, place) {
        App.Data.lastPickedId = place.id;
        if (!App.Data.history) App.Data.history = [];
        if (!App.Data.history.includes(place.id)) {
            App.Data.history.push(place.id);
        }
    },

    getElements() {
        return {
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
            mapsBtn: getEl('open-maps-btn'),
            photoCont: getEl('res-photo-container'),
            photoSection: getEl('res-photo-section'),
            photosViewAll: getEl('view-all-photos'),
            reviewsViewAll: getEl('view-all-reviews'),
            reviewsCont: getEl('res-reviews-container'),
            reviewsList: getEl('reviews-list')
        };
    },

    renderHeader(el, place, fromShare) {
        if (el.name) el.name.textContent = place.name;
        if (el.address) el.address.textContent = place.vicinity;
        if (el.reviewsViewAll) el.reviewsViewAll.href = place.googleMapsURI || '#';
        if (el.photosViewAll) el.photosViewAll.href = place.googleMapsURI || '#';
    },

    renderPhotos(el, place) {
        if (!el.photoSection) return;

        if (place.photos && place.photos.length > 0) {
            el.photoSection.classList.remove('hidden');
            if (el.photoCont) {
                el.photoCont.innerHTML = '';
                const fragment = document.createDocumentFragment();
                place.photos.forEach(photo => {
                    const img = document.createElement('img');
                    img.src = photo.getURI({ maxHeight: 400 });
                    img.className = 'photo-item';
                    img.alt = place.name;
                    img.loading = 'lazy';
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.3s ease';
                    img.onload = () => { img.style.opacity = '1'; };
                    img.onerror = function () {
                        if (!this.getAttribute('data-retried')) {
                            this.setAttribute('data-retried', 'true');
                            setTimeout(() => {
                                const sep = this.src.includes('?') ? '&' : '?';
                                this.src = this.src + sep + 'retry=' + Date.now();
                            }, 1000);
                        } else {
                            this.style.display = 'none';
                        }
                    };
                    img.onclick = () => window.open(img.src, '_blank');
                    fragment.appendChild(img);
                });
                el.photoCont.appendChild(fragment);
            }
        } else {
            el.photoSection.classList.add('hidden');
        }
    },

    renderReviews(el, place) {
        if (!el.reviewsCont || !el.reviewsList) return;

        if (place.reviews && place.reviews.length > 0) {
            el.reviewsCont.classList.remove('hidden');
            el.reviewsList.innerHTML = '';
            el.reviewsList.scrollLeft = 0;
            const validReviews = place.reviews
                .filter(r => r.text && (r.text.text || r.text).length > 0)
                .sort((a, b) => {
                    const timeA = a.publishTime ? new Date(a.publishTime).getTime() : 0;
                    const timeB = b.publishTime ? new Date(b.publishTime).getTime() : 0;
                    return timeB - timeA;
                });

            if (validReviews.length === 0) {
                el.reviewsCont.classList.add('hidden');
            } else {
                const fragment = document.createDocumentFragment();
                validReviews.forEach(review => {
                    const item = document.createElement('div');
                    item.className = 'review-item';
                    const stars = '⭐'.repeat(Math.round(review.rating || 0));
                    const timeStr = review.relativePublishTimeDescription || "";
                    const topDiv = document.createElement('div');
                    topDiv.className = 'review-top';
                    const authorSpan = document.createElement('span');
                    authorSpan.className = 'review-author';
                    authorSpan.textContent = review.authorAttribution?.displayName || "Anonymous";
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'review-time';
                    timeSpan.textContent = timeStr;
                    topDiv.appendChild(authorSpan);
                    topDiv.appendChild(timeSpan);

                    const starsDiv = document.createElement('div');
                    starsDiv.className = 'review-stars';
                    starsDiv.textContent = stars;

                    const textP = document.createElement('p');
                    textP.className = 'review-text';
                    textP.textContent = review.text?.text || review.text || "";

                    item.appendChild(topDiv);
                    item.appendChild(starsDiv);
                    item.appendChild(textP);
                    fragment.appendChild(item);
                });
                el.reviewsList.appendChild(fragment);
            }
        } else {
            el.reviewsCont.classList.add('hidden');
        }
    },

    renderDetails(el, place, App) {
        const t = App.translations[App.currentLang];

        // Rating
        const hasRating = typeof place.rating === 'number' && place.rating > 0;
        if (el.rating) el.rating.textContent = hasRating ? place.rating : (t.ratingNew.replace(/⭐\s*/, ''));

        // Price
        const priceText = this.getPriceDisplay(place.priceLevel, t);
        if (el.price) el.price.textContent = priceText;
        if (el.priceCont) el.priceCont.style.display = priceText ? 'flex' : 'none';

        // Category
        const catFull = this.getPlaceCategory(place, App);
        if (catFull) {
            const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
            if (el.catIcon) el.catIcon.textContent = emojiMatch ? emojiMatch[1] : "🍴";
            if (el.cat) el.cat.textContent = emojiMatch ? emojiMatch[2] : catFull;
            if (el.catCont) el.catCont.style.display = 'flex';
        } else if (el.catCont) el.catCont.style.display = 'none';

        // Opening Hours
        const todayHours = this.getTodayHours(place, App);
        if (el.hours) el.hours.textContent = todayHours;
        if (el.hoursCont) el.hoursCont.style.display = 'flex'; // Always show if we have a message (including "No info")

        // Distance
        if (place.durationText) {
            if (el.distance) el.distance.textContent = place.durationText;
            if (el.distanceCont) el.distanceCont.style.display = 'flex';
        } else if (el.distanceCont) el.distanceCont.style.display = 'none';

        // Phone
        if (place.phone) {
            if (el.phone) {
                el.phone.textContent = `📞 ${place.phone}`;
                el.phone.href = `tel:${place.phone.replace(/\s+/g, '')}`;
                el.phone.style.display = '';
            }
        } else if (el.phone) el.phone.style.display = 'none';

        if (el.mapsBtn) el.mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
    },

    async renderMap(container, place, App) {
        if (!container) return;
        if (!place.location) {
            container.style.display = 'none';
            return;
        }
        container.classList.add('skeleton');
        container.style.display = 'block';
        try {
            const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("marker")
            ]);

            const map = new Map(container, {
                center: place.location,
                zoom: 16,
                mapId: "DEMO_MAP_ID",
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy',
                colorScheme: 'FOLLOW_SYSTEM'
            });

            new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.name
            });

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

                // Add Re-center Control
                const centerBtn = document.createElement('button');
                centerBtn.className = 'map-center-btn';
                centerBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#666"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
                centerBtn.title = 'Re-center Map';
                centerBtn.onclick = () => {
                    const b = new google.maps.LatLngBounds();
                    b.extend(place.location);
                    b.extend(App.Data.userPos);
                    map.fitBounds(b, 50);
                };
                map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerBtn);
            } else {
                // If no user position, just center on place
                const centerBtn = document.createElement('button');
                centerBtn.className = 'map-center-btn';
                centerBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#666"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
                centerBtn.title = 'Re-center Map';
                centerBtn.onclick = () => {
                    map.setCenter(place.location);
                    map.setZoom(16);
                };
                map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerBtn);
            }

            google.maps.event.addListenerOnce(map, 'idle', () => container.classList.remove('skeleton'));
        } catch (e) {
            console.error("Map Render Error:", e);
            container.style.display = 'none';
        }
    },

    startSlotAnimation(App) {
        const slotName = getEl('slot-name');
        if (!slotName) return;
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
        for (const [id, keywords] of Object.entries(CUISINE_MAPPING)) {
            if (isPlaceMatch(place, keywords)) return t[id];
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
        const t = App.translations[App.currentLang];
        const descriptions = place.openingHours?.weekdayDescriptions;
        if (!descriptions || descriptions.length !== 7) return t.noHoursInfo;

        const today = new Date();
        // Google weekdayDescriptions usually start with Monday (index 0) or Sunday depending on locale, 
        // but we can reliably find it by matching the day name.
        const dayName = today.toLocaleDateString(App.currentLang === 'en' ? 'en-US' : (App.currentLang === 'ja' ? 'ja-JP' : 'zh-HK'), { weekday: 'long' });
        const enDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

        const match = descriptions.find(d => d.includes(dayName) || d.includes(enDayName)) || descriptions[(today.getDay() + 6) % 7];

        if (match) {
            const parts = match.split(/: |：/);
            return parts[1] ? parts[1].trim() : match;
        }
        return t.noHoursInfo;
    },

    triggerHaptic(duration) {
        if (navigator.vibrate) navigator.vibrate(duration || CONSTANTS.HAPTIC_FEEDBACK_DURATION.SHORT);
    },

    triggerConfetti() {
        const confettiInstance = confetti.create ? confetti.create() : confetti;
        confettiInstance({
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
        const shareUrl = `${window.location.origin}${window.location.pathname}?resId=${place.id}${App.Data.userPos ? `&lat=${App.Data.userPos.lat}&lng=${App.Data.userPos.lng}` : ''}`;
        const shareText = t.shareText.replace('${name}', place.name);

        if (navigator.share) {
            try {
                await navigator.share({ title: place.name, text: shareText, url: shareUrl });
            } catch (e) { console.log("Share failed", e); }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                alert(t.linkCopied);
            } catch (e) { alert(shareUrl); }
        }
    }
};

export default UI;
