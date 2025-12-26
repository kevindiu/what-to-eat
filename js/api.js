import { getEl, getCurrentPosition } from './utils.js';
import { CUISINE_MAPPING, PLACE_FIELDS, PRICE_LEVEL_MAP } from './constants.js';

/**
 * Centalized mapping from Google Place object to internal restaurant model.
 */
function mapPlaceData(p, translations) {
    const t = translations;
    return {
        name: typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || t.unknownName),
        rating: p.rating,
        userRatingCount: p.userRatingCount || 0,
        vicinity: p.formattedAddress || p.vicinity || t.noAddress,
        place_id: p.id || p.place_id,
        types: p.types || [],
        priceLevel: p.priceLevel,
        phone: p.nationalPhoneNumber,
        businessStatus: p.businessStatus,
        location: p.location,
        openingHours: p.regularOpeningHours,
        // Cached/Derived values
        isOpen: null, // To be filled by checkPeriodAvailability
        durationText: null,
        durationValue: null
    };
}

export async function findRestaurant(App) {
    App.UI.triggerHaptic(50);
    App.UI.showScreen('loading-screen');
    const t = App.translations[App.currentLang];

    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        App.Data.userPos = { lat: latitude, lng: longitude };

        const { Place } = await google.maps.importLibrary("places");
        const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius);

        if (!places || places.length === 0) {
            alert(t.noResults);
            App.UI.showScreen('main-flow');
            return;
        }

        const candidates = await processCandidates(places, App.Data.userPos, App);

        if (candidates.length === 0) {
            alert(t.noFilteredResults);
            App.UI.showScreen('main-flow');
            return;
        }

        App.Data.candidates = candidates;
        startSlotAnimation(App);
    } catch (error) {
        console.error("Search Error:", error);
        handleError(error, t, App);
    }
}

async function fetchNearby(Place, location, radius) {
    const request = {
        locationRestriction: { center: location, radius: radius },
        includedPrimaryTypes: ["restaurant"],
        fields: PLACE_FIELDS,
        maxResultCount: 20,
        rankPreference: 'POPULARITY'
    };
    const { places } = await Place.searchNearby(request);
    return places;
}

async function processCandidates(places, userLoc, App) {
    const t = App.translations[App.currentLang];
    const rawResults = await Promise.all(places.map(async p => {
        const item = mapPlaceData(p, t);

        try {
            // Precise Period Check
            if (item.openingHours?.periods) {
                item.isOpen = checkPeriodAvailability(item.openingHours.periods);
            }

            // Fallbacks
            if (item.isOpen === null) item.isOpen = await p.isOpen();
            if (item.isOpen === null) item.isOpen = item.openingHours?.openNow;
        } catch (e) {
            item.isOpen = null;
        }

        return item;
    }));

    // Filter: Include if strictly open OR if no data available (p.isOpen !== false)
    let filtered = rawResults.filter(p => p.isOpen !== false && (p.businessStatus === 'OPERATIONAL' || !p.businessStatus));

    // Distance Matrix
    const withDurations = await calculateDistances(userLoc, filtered);

    // Filter by walking time
    let byTime = withDurations.filter(p => p.durationValue === null || (p.durationValue / 60) <= App.Config.mins);
    if (byTime.length === 0) byTime = withDurations.sort((a, b) => (a.durationValue || 9999) - (b.durationValue || 9999)).slice(0, 3);

    // Filter by User Preferences (Categories/Price)
    return byTime.filter(p => {
        const nameNode = (p.name || "").toLowerCase();
        const types = p.types || [];
        const isExcluded = Array.from(App.Config.excluded).some(id => {
            const keywords = CUISINE_MAPPING[id] || [];
            return keywords.some(k => nameNode.includes(k) || types.some(pt => pt.toLowerCase().includes(k)));
        });
        if (isExcluded) return false;

        if (p.priceLevel !== undefined && p.priceLevel !== null) {
            const mapped = PRICE_LEVEL_MAP[p.priceLevel];
            if (mapped && App.Config.prices.size > 0 && !App.Config.prices.has(mapped)) return false;
        }
        return true;
    });
}
// Helper to check if current time is within any of the provided opening periods
function checkPeriodAvailability(periods) {
    if (!periods || !Array.isArray(periods) || periods.length === 0) return null;

    // Google Maps 24/7 signature: single period with open but no close
    if (periods.length === 1 && !periods[0].close) return true;

    const now = new Date();
    const nowAbs = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
    const WEEK_MINUTES = 10080;

    for (const period of periods) {
        if (!period.open || !period.close) continue;

        const openAbs = Number(period.open.day) * 1440 + Number(period.open.hour) * 60 + Number(period.open.minute);
        let closeAbs = Number(period.close.day) * 1440 + Number(period.close.hour) * 60 + Number(period.close.minute);

        // If close is numerically before open, it crosses the week boundary (Sunday 00:00)
        if (closeAbs <= openAbs) {
            closeAbs += WEEK_MINUTES;
        }

        // Check if current time falls within this period
        // We check two windows: the current absolute time, and the "time + one week" 
        // to catch periods that started late last week and are finishing now.
        if ((nowAbs >= openAbs && nowAbs < closeAbs) ||
            (nowAbs + WEEK_MINUTES >= openAbs && nowAbs + WEEK_MINUTES < closeAbs)) {
            return true;
        }
    }

    return false;
}

function handleError(error, t, App) {
    if (error.message === "GEOLOCATION_NOT_SUPPORTED") alert(t.noGeo);
    else if (error.code === 1) alert(t.geoError); // PERMISSION_DENIED
    else alert("Error: " + error.message);
    App.UI.showScreen('main-flow');
}

export async function calculateDistances(origin, destinations) {
    if (destinations.length === 0) return [];
    const service = new google.maps.DistanceMatrixService();
    return new Promise((resolve) => {
        service.getDistanceMatrix({
            origins: [origin],
            destinations: destinations.map(d => d.location),
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status !== "OK") {
                resolve(destinations.map(d => ({ ...d, durationText: null, durationValue: null })));
                return;
            }
            const results = response.rows[0].elements;
            resolve(destinations.map((d, i) => ({
                ...d,
                durationText: results[i].status === "OK" ? results[i].duration.text : null,
                durationValue: results[i].status === "OK" ? results[i].duration.value : null
            })));
        });
    });
}

export function startSlotAnimation(App) {
    const slotName = getEl('slot-name');
    let count = 0;
    const interval = setInterval(() => {
        const temp = App.Data.candidates[Math.floor(Math.random() * App.Data.candidates.length)];
        slotName.textContent = temp.name;
        if (++count > 15) {
            clearInterval(interval);
            reRoll(App);
        }
    }, 100);
}

export async function reRoll(App) {
    App.UI.triggerHaptic([50, 30, 50]);
    if (App.Data.candidates.length === 0) return findRestaurant(App);

    let candidates = App.Data.candidates;
    if (candidates.length > 1 && App.Data.lastPickedId) {
        const others = candidates.filter(p => p.place_id !== App.Data.lastPickedId);
        if (others.length > 0) candidates = others;
    }

    let randomPlace = candidates[Math.floor(Math.random() * candidates.length)];

    const hasHours = randomPlace.openingHours?.weekdayDescriptions?.length > 0;
    if ((!randomPlace.vicinity || !hasHours) && randomPlace.place_id) {
        App.UI.showScreen('loading-screen');
        try {
            const { Place } = await google.maps.importLibrary("places");
            const p = new Place({ id: randomPlace.place_id });
            await p.fetchFields({ fields: PLACE_FIELDS });

            randomPlace = mapPlaceData(p, App.translations[App.currentLang]);

            const idx = App.Data.candidates.findIndex(item => item.place_id === randomPlace.place_id);
            if (idx !== -1) App.Data.candidates[idx] = randomPlace;
        } catch (e) {
            console.error("Fetch Details Error:", e);
        }
    }
    displayResult(App, randomPlace);
}

export async function displayResult(App, place) {
    App.UI.showScreen('result-screen');
    App.Data.lastPickedId = place.place_id;

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

    el.name.textContent = place.name;

    // Rating
    const hasRating = typeof place.rating === 'number' && place.rating > 0;
    el.rating.textContent = hasRating ? place.rating : (t.ratingNew.replace(/⭐\s*/, ''));
    el.ratingCont.style.display = 'flex';

    // Price
    const priceText = getPriceDisplay(place.priceLevel, t);
    el.price.textContent = priceText;
    el.priceCont.style.display = priceText ? 'flex' : 'none';

    // Category
    const catFull = getPlaceCategory(place, App);
    if (catFull) {
        const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
        if (emojiMatch) {
            el.catIcon.textContent = emojiMatch[1];
            el.cat.textContent = emojiMatch[2];
        } else {
            el.catIcon.textContent = "🍴";
            el.cat.textContent = catFull;
        }
        el.catCont.style.display = 'flex';
    } else {
        el.catCont.style.display = 'none';
    }

    // Opening Hours
    let todayHoursStr = "";
    const descriptions = place.openingHours?.weekdayDescriptions;
    if (descriptions && descriptions.length === 7) {
        const today = new Date();
        const dayIdx = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // 1. Try language-aware string matching (robust)
        const mapLangMap = { 'zh': 'zh-HK', 'en': 'en-US', 'ja': 'ja-JP' };
        const appLocale = mapLangMap[App.currentLang] || 'zh-HK';
        const localeDayName = today.toLocaleDateString(appLocale, { weekday: 'long' });
        const enDayName = today.toLocaleDateString('en-US', { weekday: 'long' });

        let match = descriptions.find(d => d.includes(localeDayName) || d.includes(enDayName));

        // 2. Fallback: Google's New Places API descriptions are Sunday-first.
        // If we can't find by string, the index should be correct.
        if (!match) match = descriptions[dayIdx];

        if (match) {
            const parts = match.split(/: |：/);
            todayHoursStr = parts[1] ? parts[1].trim() : match;
        }
    }

    if (todayHoursStr) {
        el.hours.textContent = todayHoursStr;
        el.hoursCont.style.display = 'flex';
    } else {
        el.hoursCont.style.display = 'none';
    }

    el.address.textContent = place.vicinity;
    getEl('result-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });

    el.mapCont.classList.add('skeleton');
    el.mapCont.style.display = 'block';

    // Map logic
    if (place.location) {
        try {
            const [{ Map }, { Marker }] = await Promise.all([google.maps.importLibrary("maps"), google.maps.importLibrary("marker")]);
            const map = new Map(el.mapCont, {
                center: place.location,
                zoom: 16,
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy',
                colorScheme: 'FOLLOW_SYSTEM'
            });
            new Marker({ position: place.location, map: map, title: place.name, animation: google.maps.Animation.DROP });
            if (App.Data.userPos) {
                new Marker({ position: App.Data.userPos, map: map, title: "Your Location", icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" } });
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(place.location); bounds.extend(App.Data.userPos);
                map.fitBounds(bounds, 50);
            }
            // Remove skeleton after map tiles settle a bit
            google.maps.event.addListenerOnce(map, 'idle', () => {
                el.mapCont.classList.remove('skeleton');
            });
        } catch (e) { el.mapCont.style.display = 'none'; }
    } else el.mapCont.style.display = 'none';

    // Phone
    if (place.phone) {
        el.phone.textContent = `📞 ${place.phone}`;
        el.phone.href = `tel:${place.phone.replace(/\s+/g, '')}`;
        el.phone.style.display = 'inline-flex';
    } else el.phone.style.display = 'none';

    el.mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

    // Share logic
    const shareBtn = getEl('share-btn');
    if (shareBtn) {
        shareBtn.onclick = async () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?resId=${place.place_id}${App.Data.userPos ? `&lat=${App.Data.userPos.lat}&lng=${App.Data.userPos.lng}` : ''}`;
            const shareText = t.shareText.replace('${name}', place.name);

            if (navigator.share) {
                try {
                    await navigator.share({ title: place.name, text: shareText, url: shareUrl });
                } catch (e) { console.log("Share failed", e); }
            } else {
                // Fallback: Copy to clipboard
                try {
                    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                    alert("已複製連結到剪貼簿！📋");
                } catch (e) { alert(shareUrl); }
            }
        };
    }

    // Distance
    if (place.durationText) {
        el.distance.textContent = place.durationText;
        el.distanceCont.style.display = 'flex';
    } else {
        el.distanceCont.style.display = 'none';
    }

    App.UI.triggerConfetti();
}

export function getPlaceCategory(place, App) {
    const t = App.translations[App.currentLang].categories;
    const name = (place.name || "").toLowerCase();
    const types = place.types || [];
    for (const [id, keywords] of Object.entries(CUISINE_MAPPING)) {
        if (keywords.some(k => name.includes(k) || types.some(pt => pt.toLowerCase().includes(k)))) return t[id];
    }
    return null;
}

export function getPriceDisplay(level, t) {
    const mapping = { 'PRICE_LEVEL_FREE': t.priceFree, 'PRICE_LEVEL_INEXPENSIVE': '$', 'PRICE_LEVEL_MODERATE': '$$', 'PRICE_LEVEL_EXPENSIVE': '$$$', 'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$' };
    return mapping[level] || "";
}

export async function restoreSession(App) {
    const resId = App.Data.params.get('resId');
    if (!resId) return;

    window.history.replaceState({}, document.title, window.location.pathname);
    App.UI.showScreen('loading-screen');

    try {
        const { Place } = await google.maps.importLibrary("places");
        const p = new Place({ id: resId });
        await p.fetchFields({ fields: PLACE_FIELDS });

        const lat = App.Data.params.get('lat'), lng = App.Data.params.get('lng');
        if (lat && lng) App.Data.userPos = { lat: parseFloat(lat), lng: parseFloat(lng) };

        const t = App.translations[App.currentLang];
        const restored = mapPlaceData(p, t);

        // Recalculate distance if we have position
        if (App.Data.userPos && restored.location) {
            const [withDuration] = await calculateDistances(App.Data.userPos, [restored]);
            restored.durationText = withDuration.durationText;
            restored.durationValue = withDuration.durationValue;
        }

        // Populate candidates in background so re-roll works
        if (App.Data.userPos) {
            const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius);
            if (places && places.length > 0) {
                App.Data.candidates = await processCandidates(places, App.Data.userPos, App);
            }
        }

        displayResult(App, restored);
    } catch (e) {
        console.error("Session restoration failed:", e);
        App.UI.showScreen('main-flow');
    }
}
