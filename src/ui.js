import { getEl, isPlaceMatch } from './utils.js';
import { reRoll } from './api.js';
import { CUISINE_MAPPING, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY, CONSTANTS } from './constants.js';
import confetti from 'canvas-confetti';

export const UI = {
    /**
     * Manages screen transitions and footer visibility.
     * Screens: 'main-flow' (search), 'result-screen' (winner), 'loading-screen' (animation).
     */
    showScreen(screenId) {
        const screens = ['main-flow', 'result-screen', 'loading-screen'];
        screens.forEach(id => {
            const element = getEl(id);
            if (element) element.classList.toggle('hidden', id !== screenId);
        });

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
            if (appFooter) appFooter.classList.add('hidden');
        }
    },

    updateStrings(App) {
        const translations = App.translations[App.currentLang];
        const mappings = {
            'location-title': translations.locationTitle,
            'app-title': translations.title,
            'app-subtitle': translations.subtitle,
            'price-title': translations.priceTitle,
            'filter-title': App.Config.filterMode === 'whitelist' ? translations.filterModeWhitelist : translations.filterModeBlacklist,
            'find-btn': translations.findBtn,
            'retry-btn': translations.retry,
            'back-btn': translations.backBtn,
            'loading-text': translations.loading,
            'open-maps-btn': translations.openMaps,
            'share-btn': translations.shareBtn,
            'install-btn': translations.installBtn,
            'reviews-title': translations.reviews,
            'view-all-reviews': translations.viewAllReviews,
            'photos-title': translations.photosTitle,
            'view-all-photos': translations.viewAllPhotos
        };

        Object.entries(mappings).forEach(([id, text]) => {
            const element = getEl(id);
            if (element) element.textContent = text;
        });

        // Location specific updates
        const locInput = getEl('location-input');
        if (locInput) locInput.placeholder = translations.searchPlaceholder;

        const locDisplay = getEl('location-display');
        if (locDisplay && !App.Data.manualLocation) {
            locDisplay.textContent = translations.useCurrentLocation;
        }

        const distTitle = getEl('distance-title');
        if (distTitle) {
            distTitle.textContent = "";
            distTitle.appendChild(document.createTextNode(`${translations.distanceTitle} (`));
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
                label.textContent = isActive ? translations.includeClosed : translations.excludeClosed;
            }
        }

        const filterModeLabel = getEl('filter-mode-label');
        if (filterModeLabel) {
            filterModeLabel.textContent = App.Config.filterMode === 'whitelist' ? translations.filterToggleBlacklist : translations.filterToggleWhitelist;
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
            const priceValue = item.dataset.price;
            item.classList.toggle('active', App.Config.prices.has(priceValue));
            item.onclick = () => {
                const currentlySelected = App.Config.prices.has(priceValue);
                if (currentlySelected) {
                    App.Config.prices.delete(priceValue);
                    item.classList.remove('active');
                } else {
                    App.Config.prices.add(priceValue);
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

        const elements = this.getElements();

        // Sequential rendering for clarity and stability
        this.renderHeader(elements, place, fromShare);
        this.renderPhotos(elements, place);
        this.renderReviews(elements, place);
        this.renderDetails(elements, place, App);
        this.renderMap(elements.mapCont, place, App);

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

    renderHeader(elements, place, fromShare) {
        if (elements.name) elements.name.textContent = place.name;
        if (elements.address) elements.address.textContent = place.vicinity;

        if (elements.reviewsViewAll) elements.reviewsViewAll.href = place.reviewsUri || place.googleMapsUri || '#';
        if (elements.photosViewAll) elements.photosViewAll.href = place.photosUri || place.googleMapsUri || '#';
    },

    renderPhotos(elements, place) {
        if (!elements.photoSection) return;

        if (place.photos && place.photos.length > 0) {
            elements.photoSection.classList.remove('hidden');
            if (elements.photoCont) {
                elements.photoCont.innerHTML = '';
                const fragment = document.createDocumentFragment();
                place.photos.forEach(photo => {
                    const img = this.createPhotoItem(photo, place.name);
                    fragment.appendChild(img);
                });
                elements.photoCont.appendChild(fragment);
            }
        } else {
            elements.photoSection.classList.add('hidden');
        }
    },

    createPhotoItem(photo, altText) {
        const img = document.createElement('img');
        img.src = photo.getURI({ maxHeight: 400 });
        img.className = 'photo-item';
        img.alt = altText;
        img.loading = 'lazy';
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        img.onload = () => { img.style.opacity = '1'; };
        img.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = Array.from(img.parentElement.children).indexOf(img);
            this.openPhotoModal(index);
        };
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
        return img;
    },

    renderReviews(elements, place) {
        if (!elements.reviewsCont || !elements.reviewsList) return;

        if (place.reviews && place.reviews.length > 0) {
            elements.reviewsCont.classList.remove('hidden');
            elements.reviewsList.innerHTML = '';
            elements.reviewsList.scrollLeft = 0;
            const validReviews = place.reviews
                .filter(r => r.text && (r.text.text || r.text).length > 0)
                .sort((a, b) => {
                    const timeA = a.publishTime ? new Date(a.publishTime).getTime() : 0;
                    const timeB = b.publishTime ? new Date(b.publishTime).getTime() : 0;
                    return timeB - timeA;
                });

            if (validReviews.length === 0) {
                elements.reviewsCont.classList.add('hidden');
            } else {
                const fragment = document.createDocumentFragment();
                validReviews.forEach(review => {
                    const item = this.createReviewItem(review);
                    fragment.appendChild(item);
                });
                elements.reviewsList.appendChild(fragment);
            }
        } else {
            elements.reviewsCont.classList.add('hidden');
        }
    },

    createReviewItem(review) {
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
        return item;
    },

    renderDetails(elements, place, App) {
        const translations = App.translations[App.currentLang];

        // Rating
        const hasRating = typeof place.rating === 'number' && place.rating > 0;
        if (elements.rating) elements.rating.textContent = hasRating ? place.rating : (translations.ratingNew.replace(/⭐\s*/, ''));

        // Price
        const priceText = this.getPriceDisplay(place.priceLevel, translations);
        if (elements.price) elements.price.textContent = priceText;
        if (elements.priceCont) elements.priceCont.style.display = priceText ? 'flex' : 'none';

        // Category
        const catFull = this.getPlaceCategory(place, App);
        if (catFull) {
            const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
            if (elements.catIcon) elements.catIcon.textContent = emojiMatch ? emojiMatch[1] : "🍴";
            if (elements.cat) elements.cat.textContent = emojiMatch ? emojiMatch[2] : catFull;
            if (elements.catCont) elements.catCont.style.display = 'flex';
        } else if (elements.catCont) elements.catCont.style.display = 'none';

        // Opening Hours
        const todayHours = this.getTodayHours(place, App);
        if (elements.hours) elements.hours.textContent = todayHours;
        if (elements.hoursCont) elements.hoursCont.style.display = 'flex'; // Always show if we have a message (including "No info")

        // Distance
        if (place.durationText) {
            if (elements.distance) elements.distance.textContent = place.durationText;
            if (elements.distanceCont) elements.distanceCont.style.display = 'flex';
        } else if (elements.distanceCont) elements.distanceCont.style.display = 'none';

        // Phone
        if (place.phone) {
            if (elements.phone) {
                elements.phone.textContent = `📞 ${place.phone}`;
                elements.phone.href = `tel:${place.phone.replace(/\s+/g, '')}`;
                elements.phone.style.display = '';
            }
        } else if (elements.phone) elements.phone.style.display = 'none';

        if (elements.mapsBtn) elements.mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
    },

    /**
     * Renders a Google Map focused on the restaurant, with a custom re-center control.
     * Uses the Advanced Marker library for a premium feel.
     */
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
                this.renderUserLocationOnMap(map, App.Data.userPos, place.location, AdvancedMarkerElement);
            }

            // Cross-platform re-center control (custom UI to match branding)
            const centerBtn = this.createMapCenterControl(map, place.location, App.Data.userPos);
            map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(centerBtn);

            google.maps.event.addListenerOnce(map, 'idle', () => container.classList.remove('skeleton'));
        } catch (e) {
            console.error("Map Render Error:", e);
            container.style.display = 'none';
        }
    },

    // --- Photo Modal Management ---

    openPhotoModal(index) {
        const app = this.App || window.App; // Fallback to window.App if available
        if (!app?.Data?.currentPlace?.photos) {
            console.error("Photo Modal Error: No photos found in current place data.");
            return;
        }

        this.currentPhotoIndex = index;
        const modal = getEl('photo-modal');
        const img = getEl('modal-img');
        const photos = app.Data.currentPlace.photos;
        const photo = photos[index];

        if (!photo) return;

        img.src = typeof photo.getURI === 'function' ? photo.getURI({ maxHeight: 1200 }) : (photo.cachedURI || "");
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        const hasMultiple = photos.length > 1;
        getEl('modal-prev').style.display = hasMultiple ? 'block' : 'none';
        getEl('modal-next').style.display = hasMultiple ? 'block' : 'none';
    },

    closePhotoModal() {
        const modal = getEl('photo-modal');
        if (modal) modal.classList.add('hidden');
        document.body.style.overflow = '';
    },

    navigatePhoto(step) {
        const photos = this.App?.Data?.currentPlace?.photos;
        if (!photos || photos.length <= 1) return;

        this.currentPhotoIndex = (this.currentPhotoIndex + step + photos.length) % photos.length;
        const img = getEl('modal-img');
        const photo = photos[this.currentPhotoIndex];

        // Subtle fade effect during navigation
        img.style.opacity = '0.5';
        img.src = photo.getURI({ maxHeight: 1000 });
        img.onload = () => { img.style.opacity = '1'; };
    },

    initPhotoModal(App) {
        this.App = App;
        const prevBtn = getEl('modal-prev');
        const nextBtn = getEl('modal-next');
        const modalImg = getEl('modal-img');
        const overlay = document.querySelector('.modal-overlay');

        if (modalImg) {
            modalImg.onclick = () => this.closePhotoModal();
            modalImg.style.cursor = 'zoom-out';
        }
        if (overlay) overlay.onclick = () => this.closePhotoModal();
        if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); this.navigatePhoto(-1); };
        if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); this.navigatePhoto(1); };

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            const modal = getEl('photo-modal');
            if (modal && !modal.classList.contains('hidden')) {
                if (e.key === 'Escape') this.closePhotoModal();
                if (e.key === 'ArrowLeft') this.navigatePhoto(-1);
                if (e.key === 'ArrowRight') this.navigatePhoto(1);
            }
        });
    },

    renderUserLocationOnMap(map, userPos, placeLoc, AdvancedMarkerElement) {
        const userDot = document.createElement('div');
        userDot.style.width = '16px';
        userDot.style.height = '16px';
        userDot.style.backgroundColor = '#4285F4';
        userDot.style.border = '2px solid white';
        userDot.style.borderRadius = '50%';
        userDot.style.boxShadow = '0 0 4px rgba(0,0,0,0.3)';

        new AdvancedMarkerElement({
            map,
            position: userPos,
            title: "Your Location",
            content: userDot
        });

        const bounds = new google.maps.LatLngBounds();
        bounds.extend(placeLoc);
        bounds.extend(userPos);
        map.fitBounds(bounds, 50);
    },

    createMapCenterControl(map, placeLoc, userPos) {
        const centerBtn = document.createElement('button');
        centerBtn.className = 'map-center-btn';
        centerBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#666"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>';
        centerBtn.title = 'Re-center Map';
        centerBtn.onclick = () => {
            if (userPos) {
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(placeLoc);
                bounds.extend(userPos);
                map.fitBounds(bounds, 50);
            } else {
                map.setCenter(placeLoc);
                map.setZoom(16);
            }
        };
        return centerBtn;
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
        const categoriesTranslations = App.translations[App.currentLang].categories;
        for (const [id, keywords] of Object.entries(CUISINE_MAPPING)) {
            if (isPlaceMatch(place, keywords)) return categoriesTranslations[id];
        }
        return null;
    },

    getPriceDisplay(level, translations) {
        if (level === undefined || level === null) return "";
        let key = level;
        if (PRICE_VAL_TO_KEY[key]) key = PRICE_VAL_TO_KEY[key];
        const config = PRICE_LEVEL_MAP[key];
        return config ? config.label(translations) : "";
    },

    /**
     * Resolves today's opening hours from Google's weekdayDescriptions array.
     * Uses fuzzy string matching to find the correct day regardless of the user's locale.
     */
    getTodayHours(place, App) {
        const translations = App.translations[App.currentLang];
        const descriptions = place.openingHours?.weekdayDescriptions;
        if (!descriptions || descriptions.length !== 7) return translations.noHoursInfo;

        const today = new Date();
        // Match day name in both local and English as a fallback for various Google API behaviors.
        const dayName = today.toLocaleDateString(App.currentLang === 'en' ? 'en-US' : (App.currentLang === 'ja' ? 'ja-JP' : 'zh-HK'), { weekday: 'long' });
        const enDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

        const match = descriptions.find(d => d.includes(dayName) || d.includes(enDayName)) || descriptions[(today.getDay() + 6) % 7];

        if (match) {
            const parts = match.split(/: |：/);
            return parts[1] ? parts[1].trim() : match;
        }
        return translations.noHoursInfo;
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
        const translations = App.translations[App.currentLang];
        const shareUrl = `${window.location.origin}${window.location.pathname}?resId=${place.id}${App.Data.userPos ? `&lat=${App.Data.userPos.lat}&lng=${App.Data.userPos.lng}` : ''}`;
        const shareText = translations.shareText.replace('${name}', place.name);

        if (navigator.share) {
            try {
                await navigator.share({ title: place.name, text: shareText, url: shareUrl });
            } catch (e) {
                console.error("Share failed:", e);
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                alert(translations.linkCopied);
            } catch (e) { alert(shareUrl); }
        }
    }
};

export default UI;
