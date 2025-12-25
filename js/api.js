import { getEl, getCurrentPosition } from './utils.js';
import { CUISINE_MAPPING } from './constants.js';

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
            alert(t.noResults + " (Try adjusting filters)");
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
        fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"],
        maxResultCount: 20,
        rankPreference: 'POPULARITY'
    };
    const { places } = await Place.searchNearby(request);
    return places;
}

async function processCandidates(places, userLoc, App) {
    const rawResults = await Promise.all(places.map(async p => {
        let isOpenStatus = null;
        try { isOpenStatus = await p.isOpen(); } catch (e) { isOpenStatus = p.regularOpeningHours?.openNow; }

        const t = App.translations[App.currentLang];
        return {
            name: typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || t.unknownName),
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            vicinity: p.formattedAddress || p.vicinity || t.noAddress,
            place_id: p.id || p.place_id,
            types: p.types || [],
            isOpen: isOpenStatus,
            priceLevel: p.priceLevel,
            phone: p.nationalPhoneNumber,
            businessStatus: p.businessStatus,
            location: p.location
        };
    }));

    // Filter open/operational
    let filtered = rawResults.filter(p => p.isOpen === true && (p.businessStatus === 'OPERATIONAL' || !p.businessStatus));
    if (filtered.length === 0) filtered = rawResults.filter(p => p.businessStatus === 'OPERATIONAL' || !p.businessStatus);

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

        if (p.priceLevel) {
            const mapped = { 'PRICE_LEVEL_INEXPENSIVE': '1', 'PRICE_LEVEL_MODERATE': '2', 'PRICE_LEVEL_EXPENSIVE': '3', 'PRICE_LEVEL_VERY_EXPENSIVE': '4' }[p.priceLevel];
            if (mapped && !App.Config.prices.has(mapped)) return false;
        }
        return true;
    });
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

    if (!randomPlace.vicinity && randomPlace.place_id) {
        App.UI.showScreen('loading-screen');
        try {
            const { Place } = await google.maps.importLibrary("places");
            const p = new Place({ id: randomPlace.place_id });
            await p.fetchFields({ fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"] });
            randomPlace = {
                name: p.displayName?.text || p.displayName || "Unknown",
                rating: p.rating,
                userRatingCount: p.userRatingCount,
                vicinity: p.formattedAddress || "地址不詳",
                place_id: p.id,
                types: p.types || [],
                priceLevel: p.priceLevel,
                phone: p.nationalPhoneNumber,
                businessStatus: p.businessStatus,
                location: p.location
            };
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
    getEl('res-name').textContent = place.name;

    const t = App.translations[App.currentLang];

    // Rating
    const ratingVal = place.rating;
    const hasRating = typeof ratingVal === 'number' && ratingVal > 0;
    getEl('res-rating').textContent = hasRating ? ratingVal : (t.ratingNew.replace(/⭐\s*/, ''));
    getEl('res-rating-container').style.display = 'flex';

    // Price
    const priceText = getPriceDisplay(place.priceLevel, t);
    getEl('res-price').textContent = priceText;
    getEl('res-price-container').style.display = priceText ? 'flex' : 'none';

    // Category
    const catFull = getPlaceCategory(place, App);
    if (catFull) {
        const emojiMatch = catFull.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)\s*(.*)$/u);
        if (emojiMatch) {
            getEl('res-category-icon').textContent = emojiMatch[1];
            getEl('res-category').textContent = emojiMatch[2];
        } else {
            getEl('res-category-icon').textContent = "🍴";
            getEl('res-category').textContent = catFull;
        }
        getEl('res-category-container').style.display = 'flex';
    } else {
        getEl('res-category-container').style.display = 'none';
    }

    getEl('res-address').textContent = place.vicinity;
    getEl('result-screen').scrollIntoView({ behavior: 'smooth', block: 'start' });

    const mapDiv = getEl('res-map-container');
    if (place.location) {
        try {
            const [{ Map }, { Marker }] = await Promise.all([google.maps.importLibrary("maps"), google.maps.importLibrary("marker")]);
            const map = new Map(mapDiv, { center: place.location, zoom: 16, disableDefaultUI: false, mapTypeControl: false, streetViewControl: false, gestureHandling: 'greedy' });
            new Marker({ position: place.location, map: map, title: place.name, animation: google.maps.Animation.DROP });
            if (App.Data.userPos) {
                new Marker({ position: App.Data.userPos, map: map, title: "Your Location", icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeWeight: 2, strokeColor: "white" } });
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(place.location); bounds.extend(App.Data.userPos);
                map.fitBounds(bounds, 50);
            }
            mapDiv.style.display = 'block';
        } catch (e) { mapDiv.style.display = 'none'; }
    } else mapDiv.style.display = 'none';

    const phoneEl = getEl('res-phone');
    if (place.phone) {
        phoneEl.textContent = `📞 ${place.phone}`;
        phoneEl.href = `tel:${place.phone.replace(/\s+/g, '')}`;
        phoneEl.style.display = 'inline-flex';
    }
    else phoneEl.style.display = 'none';

    getEl('open-maps-btn').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;

    // Distance
    const distContainer = getEl('res-distance-container');
    if (place.durationText) {
        getEl('res-distance').textContent = place.durationText;
        distContainer.style.display = 'flex';
    } else {
        distContainer.style.display = 'none';
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
        await p.fetchFields({ fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"] });

        const lat = App.Data.params.get('lat'), lng = App.Data.params.get('lng');
        if (lat && lng) App.Data.userPos = { lat: parseFloat(lat), lng: parseFloat(lng) };

        const t = App.translations[App.currentLang];
        const restored = {
            name: p.displayName?.text || p.displayName || t.unknownName,
            rating: p.rating,
            userRatingCount: p.userRatingCount,
            vicinity: p.formattedAddress || t.noAddress,
            place_id: p.id,
            types: p.types || [],
            priceLevel: p.priceLevel,
            phone: p.nationalPhoneNumber,
            businessStatus: p.businessStatus,
            location: p.location
        };

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
