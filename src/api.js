import { getEl, getCurrentPosition } from './utils.js';
import { CUISINE_MAPPING, PLACE_FIELDS, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY } from './constants.js';

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
        isOpen: null,
        durationText: null,
        durationValue: null
    };
}

export async function findRestaurant(App) {
    App.UI.triggerHaptic(50);
    App.UI.showScreen('loading-screen');
    App.Data.history = [];
    const t = App.translations[App.currentLang];

    try {
        let position;
        if (App.Data.manualLocation) {
            position = { coords: { latitude: App.Data.manualLocation.lat, longitude: App.Data.manualLocation.lng } };
        } else {
            position = await getCurrentPosition();
        }

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
            if (item.openingHours?.periods) {
                item.isOpen = checkPeriodAvailability(item.openingHours.periods);
            }
            if (item.isOpen === null) item.isOpen = await p.isOpen();
            if (item.isOpen === null) item.isOpen = item.openingHours?.openNow;
        } catch (e) { item.isOpen = null; }
        return item;
    }));

    let filtered = rawResults.filter(p => {
        if (p.businessStatus !== 'OPERATIONAL' && p.businessStatus) return false;
        if (App.Config.includeClosed) return true; // Keep all operational places if includeClosed is true
        return p.isOpen !== false; // Otherwise filter out closed
    });
    const withDurations = await calculateDistances(userLoc, filtered);

    let byTime = withDurations.filter(p => p.durationValue === null || (p.durationValue / 60) <= App.Config.mins);
    if (byTime.length === 0) byTime = withDurations.sort((a, b) => (a.durationValue || 9999) - (b.durationValue || 9999)).slice(0, 3);

    return byTime.filter(p => {
        const nameNode = (p.name || "").toLowerCase();
        const types = p.types || [];
        const isExcluded = Array.from(App.Config.excluded).some(id => {
            const keywords = CUISINE_MAPPING[id] || [];
            return keywords.some(k => nameNode.includes(k) || types.some(pt => pt.toLowerCase().includes(k)));
        });
        if (isExcluded) return false;

        if (p.priceLevel !== undefined && p.priceLevel !== null) {
            let key = p.priceLevel;
            if (PRICE_VAL_TO_KEY[key]) key = PRICE_VAL_TO_KEY[key];
            const config = PRICE_LEVEL_MAP[key];
            if (config && App.Config.prices.size > 0 && !App.Config.prices.has(config.val)) return false;
        }
        return true;
    });
}

function checkPeriodAvailability(periods) {
    if (!periods || !Array.isArray(periods) || periods.length === 0) return null;
    if (periods.length === 1 && !periods[0].close) return true;

    const now = new Date();
    const nowAbs = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
    const WEEK_MINUTES = 10080;

    for (const period of periods) {
        if (!period.open || !period.close) continue;
        const openAbs = Number(period.open.day) * 1440 + Number(period.open.hour) * 60 + Number(period.open.minute);
        let closeAbs = Number(period.close.day) * 1440 + Number(period.close.hour) * 60 + Number(period.close.minute);
        if (closeAbs <= openAbs) closeAbs += WEEK_MINUTES;
        if ((nowAbs >= openAbs && nowAbs < closeAbs) || (nowAbs + WEEK_MINUTES >= openAbs && nowAbs + WEEK_MINUTES < closeAbs)) return true;
    }
    return false;
}

function handleError(error, t, App) {
    if (error.message === "GEOLOCATION_NOT_SUPPORTED") alert(t.noGeo);
    else if (error.code === 1) alert(t.geoError);
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
        slotName.textContent = temp?.name || "...";
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
    if (candidates.length > 1) {
        // Exclude everything in history if possible
        const historyIds = new Set(App.Data.history || []);
        const others = candidates.filter(p => !historyIds.has(p.place_id));

        if (others.length > 0) {
            candidates = others;
        } else if (App.Data.lastPickedId) {
            // If everything has been seen, at least avoid the immediate last one
            const avoidLast = candidates.filter(p => p.place_id !== App.Data.lastPickedId);
            if (avoidLast.length > 0) candidates = avoidLast;
        }
    }

    let randomPlace = candidates[Math.floor(Math.random() * candidates.length)];
    const hasHours = randomPlace.openingHours?.weekdayDescriptions?.length > 0;
    if ((!randomPlace.vicinity || !hasHours) && randomPlace.place_id) {
        // App.UI.showScreen('loading-screen'); // Skipped as per user request
        try {
            const { Place } = await google.maps.importLibrary("places");
            const p = new Place({ id: randomPlace.place_id });
            await p.fetchFields({ fields: PLACE_FIELDS });
            randomPlace = mapPlaceData(p, App.translations[App.currentLang]);
            const idx = App.Data.candidates.findIndex(item => item.place_id === randomPlace.place_id);
            if (idx !== -1) App.Data.candidates[idx] = randomPlace;
        } catch (e) { console.error("Fetch Details Error:", e); }
    }
    displayResult(App, randomPlace);
}

export async function displayResult(App, place) {
    App.UI.showScreen('result-screen');
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
    const priceText = getPriceDisplay(place.priceLevel, t);
    el.price.textContent = priceText;
    el.priceCont.style.display = priceText ? 'flex' : 'none';

    // Category
    const catFull = getPlaceCategory(place, App);
    if (catFull) {
        const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
        el.catIcon.textContent = emojiMatch ? emojiMatch[1] : "🍴";
        el.cat.textContent = emojiMatch ? emojiMatch[2] : catFull;
        el.catCont.style.display = 'flex';
    } else el.catCont.style.display = 'none';

    // Opening Hours
    const todayHours = getTodayHours(place, App);
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
        el.phone.style.display = 'inline-flex';
    } else el.phone.style.display = 'none';

    el.mapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

    // Map logic
    renderMap(el.mapCont, place, App);

    App.UI.triggerConfetti();
}

function getTodayHours(place, App) {
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
}

async function renderMap(container, place, App) {
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
    if (level === undefined || level === null) return "";
    let key = level;
    if (PRICE_VAL_TO_KEY[key]) key = PRICE_VAL_TO_KEY[key];
    const config = PRICE_LEVEL_MAP[key];
    return config ? config.label(t) : "";
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
        if (App.Data.userPos && restored.location) {
            const [withDuration] = await calculateDistances(App.Data.userPos, [restored]);
            restored.durationText = withDuration.durationText;
            restored.durationValue = withDuration.durationValue;
        }
        if (App.Data.userPos) {
            const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius);
            if (places && places.length > 0) App.Data.candidates = await processCandidates(places, App.Data.userPos, App);
        }
        displayResult(App, restored);
    } catch (e) { console.error("Session restoration failed:", e); App.UI.showScreen('main-flow'); }
}
