import { getEl, getCurrentPosition } from './utils.js';
import { CUISINE_MAPPING, BASIC_PLACE_FIELDS, DETAIL_PLACE_FIELDS, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY } from './constants.js';

const METERS_PER_DEGREE_LAT = 111320;

/**
 * Centalized mapping from Google Place object to internal restaurant model.
 */
function mapPlaceData(p, t) {
    return {
        name: typeof p.displayName === 'string' ? p.displayName : (p.displayName?.text || t.unknownName),
        rating: p.rating,
        userRatingCount: p.userRatingCount || 0,
        vicinity: p.formattedAddress || p.vicinity || t.noAddress,
        place_id: p.id || p.place_id,
        id: p.id || p.place_id, // Keep both for safety during transition
        types: p.types || [],
        priceLevel: p.priceLevel,
        phone: p.nationalPhoneNumber,
        businessStatus: p.businessStatus,
        location: p.location,
        openingHours: p.regularOpeningHours,
        isOpen: null,
        durationText: null,
        durationValue: null,
        photos: p.photos || [],
        reviews: p.reviews || [],
        googleMapsURI: p.googleMapsURI
    };
}

/**
 * Main function to find a random restaurant based on user location and preferences.
 * Orchestrates fetching, filtering, and selecting a winner.
 * @param {Object} App - The application state object.
 */
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

        // Perform initial pick
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        App.Data.currentPlace = await fetchPlaceDetails(Place, winner, App);

        App.UI.startSlotAnimation(App);
    } catch (error) {
        console.error("Search Error:", error);
        handleError(error, t, App);
    }
}

/**
 * Fetches nearby places from Google Places API using a grid search strategy to optimize coverage and cost.
 * @param {Object} Place - The Google Maps Place class.
 * @param {Object} location - The center location {lat, lng}.
 * @param {number} radius - Search radius in meters.
 * @returns {Promise<Array>} Array of unique place objects.
 */
async function fetchNearby(Place, location, radius) {
    // Offset by ~60% of radius to cover more ground while maintaining overlap
    // Offset by ~60% of radius to cover more ground while maintaining overlap
    const offset = radius * 0.6;
    const latOffset = offset / METERS_PER_DEGREE_LAT;
    const lngOffset = offset / (METERS_PER_DEGREE_LAT * Math.cos(location.lat * Math.PI / 180));

    // Create a 5-point grid (Center + 4 Corners) to reduce API cost
    // This reduces calls from 9 points -> 5 points (-45% cost)
    const points = [
        { lat: location.lat, lng: location.lng }, // Center
        { lat: location.lat - latOffset, lng: location.lng - lngOffset }, // Bottom-Left
        { lat: location.lat + latOffset, lng: location.lng - lngOffset }, // Top-Left
        { lat: location.lat - latOffset, lng: location.lng + lngOffset }, // Bottom-Right
        { lat: location.lat + latOffset, lng: location.lng + lngOffset }  // Top-Right
    ];

    const allPlaces = [];
    const seenIds = new Set();

    // Split 60 food types into three balanced groups of ~20 each 
    // to ensure even representation and variety in search results.
    const catGroups = [
        // Group 1: Asian & Oriental Cuisines (15 types)
        [
            "asian_restaurant", "chinese_restaurant", "indian_restaurant",
            "indonesian_restaurant", "japanese_restaurant", "korean_restaurant",
            "ramen_restaurant", "sushi_restaurant", "thai_restaurant",
            "vietnamese_restaurant", "lebanese_restaurant", "turkish_restaurant",
            "middle_eastern_restaurant", "afghani_restaurant", "african_restaurant"
        ],
        // Group 2: Western & Global Main Cuisines (18 types)
        [
            "american_restaurant", "barbecue_restaurant", "brazilian_restaurant",
            "french_restaurant", "greek_restaurant", "italian_restaurant",
            "mediterranean_restaurant", "mexican_restaurant", "pizza_restaurant",
            "seafood_restaurant", "spanish_restaurant", "steak_house",
            "buffet_restaurant", "fine_dining_restaurant", "restaurant",
            "bar_and_grill", "vegan_restaurant", "vegetarian_restaurant"
        ],
        // Group 3: Casual, Specialty & Snacks (25 types)
        [
            "bakery", "breakfast_restaurant", "brunch_restaurant", "cafe",
            "cafeteria", "coffee_shop", "dessert_restaurant", "dessert_shop",
            "diner", "donut_shop", "fast_food_restaurant", "food_court",
            "hamburger_restaurant", "ice_cream_shop", "juice_shop",
            "meal_delivery", "meal_takeaway", "sandwich_shop", "tea_house",
            "bagel_shop", "acai_shop", "confectionery", "chocolate_factory",
            "chocolate_shop", "candy_store"
        ]
    ];

    for (const groupTypes of catGroups) {
        const results = await Promise.all(points.map(async (pos) => {
            const request = {
                locationRestriction: { center: pos, radius: radius },
                includedPrimaryTypes: groupTypes,
                fields: BASIC_PLACE_FIELDS,
                maxResultCount: 20,
                rankPreference: 'POPULARITY'
            };
            try {
                const { places } = await Place.searchNearby(request);
                return places || [];
            } catch (e) {
                console.error("Fetch point error:", e);
                return [];
            }
        }));

        results.forEach(group => {
            group.forEach(p => {
                if (p && p.id && !seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    allPlaces.push(p);
                }
            });
        });
    }



    return allPlaces;
}

/**
 * Filters and validates candidate places based on business status, hours, and user preferences.
 * @param {Array} places - List of raw place objects.
 * @param {Object} userLoc - User's current location {lat, lng}.
 * @param {Object} App - The application state object.
 * @returns {Promise<Array>} Filtered list of eligible places.
 */
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

/**
 * Fetches expensive details (photos, reviews, address) only for the winner.
 * Uses localStorage with 24-hour expiry to save significantly on Google Maps API Quota.
 * @param {Object} Place - The Google Maps Place class.
 * @param {Object} basicPlace - The partial place object to enrich.
 * @param {Object} App - The application state.
 * @returns {Promise<Object>} The detailed place object.
 */
export async function fetchPlaceDetails(Place, basicPlace, App) {
    if (!basicPlace || !basicPlace.place_id) return basicPlace;

    const cacheKey = `place_detail_${basicPlace.place_id}`;
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    const restorePhotoMethods = (photos) => {
        if (!photos) return photos;
        return photos.map(p => ({
            ...p,
            getURI: (options) => p.cachedURI || ""
        }));
    };

    // Try reading from cache
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (now - timestamp < TTL) {
                // Restore photo methods so UI doesn't crash
                if (data.photos) data.photos = restorePhotoMethods(data.photos);

                // Strip location-dependent fields from cache to ensure we don't show stale distances
                delete data.durationText;
                delete data.durationValue;
                delete data.distanceText;
                delete data.distanceValue;

                // Preserve duration info which is calculated client-side
                const { durationText, durationValue } = basicPlace;
                Object.assign(basicPlace, data);
                if (durationText) basicPlace.durationText = durationText;
                if (durationValue) basicPlace.durationValue = durationValue;

                return basicPlace;
            }
        }
    } catch (e) {
        console.warn("Cache read error:", e);
    }



    try {
        const p = new Place({ id: basicPlace.place_id });
        // Must fetch BASIC + DETAIL fields to ensure mapPlaceData has everything it needs
        await p.fetchFields({ fields: [...BASIC_PLACE_FIELDS, ...DETAIL_PLACE_FIELDS] });

        const mapped = mapPlaceData(p, App.translations[App.currentLang]);

        // Pre-fetch photo URIs because the getURI method is lost after JSON.stringify
        if (p.photos && p.photos.length > 0) {
            mapped.photos = p.photos.map(photo => ({
                cachedURI: photo.getURI({ maxHeight: 1000 }),
                widthPx: photo.widthPx,
                heightPx: photo.heightPx,
                authorAttributions: photo.authorAttributions
            }));
        }

        // Merge mapped data back into the basic object
        // Preserve duration info which is calculated client-side and not available in Place details
        const { durationText, durationValue } = basicPlace;
        Object.assign(basicPlace, mapped);
        if (durationText) basicPlace.durationText = durationText;
        if (durationValue) basicPlace.durationValue = durationValue;

        // Persist to cache
        localStorage.setItem(cacheKey, JSON.stringify({
            data: mapped,
            timestamp: now
        }));

        // Restore methods for the current session object
        if (basicPlace.photos) basicPlace.photos = restorePhotoMethods(basicPlace.photos);

    } catch (e) {
        console.error("Error fetching place details:", e);
    }
    return basicPlace;
}

function handleError(error, t, App) {
    if (error.message === "GEOLOCATION_NOT_SUPPORTED") alert(t.noGeo);
    else if (error.code === 1) alert(t.geoError);
    else alert("Error: " + error.message);
    App.UI.showScreen('main-flow');
}

/**
 * Calculates walking duration from origin to multiple destinations using Distance Matrix Service.
 * Batches requests to handle API limits.
 * @param {Object} origin - The starting location {lat, lng}.
 * @param {Array} destinations - Array of target place objects.
 * @returns {Promise<Array>} Destinations enriched with durationText and durationValue.
 */
export async function calculateDistances(origin, destinations) {
    if (destinations.length === 0) return [];

    const CHUNK_SIZE = 25;
    const chunks = [];
    for (let i = 0; i < destinations.length; i += CHUNK_SIZE) {
        chunks.push(destinations.slice(i, i + CHUNK_SIZE));
    }

    const service = new google.maps.DistanceMatrixService();

    const results = await Promise.all(chunks.map(chunk => {
        return new Promise((resolve) => {
            service.getDistanceMatrix({
                origins: [origin],
                destinations: chunk.map(d => d.location),
                travelMode: google.maps.TravelMode.WALKING,
                unitSystem: google.maps.UnitSystem.METRIC,
            }, (response, status) => {
                if (status !== "OK") {
                    resolve(chunk.map(d => ({ ...d, durationText: null, durationValue: null })));
                    return;
                }
                const elements = response.rows[0].elements;
                resolve(chunk.map((d, i) => ({
                    ...d,
                    durationText: elements[i].status === "OK" ? elements[i].duration.text : null,
                    durationValue: elements[i].status === "OK" ? elements[i].duration.value : null
                })));
            });
        });
    }));

    return results.flat();
}

/**
 * Selects a new winner from the existing candidates.
 * Tries to avoid recently visited places or the immediate previous winner.
 * @param {Object} App - The application state.
 */
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

    let winner = candidates[Math.floor(Math.random() * candidates.length)];
    const { Place } = await google.maps.importLibrary("places");
    const detailedWinner = await fetchPlaceDetails(Place, winner, App);

    App.UI.showResult(App, detailedWinner);
}

/**
 * Restores a specific restaurant session from a URL parameter (e.g., shared link).
 * @param {Object} App - The application state.
 */
export async function restoreSession(App) {
    const resId = App.Data.params.get('resId');
    if (!resId) return;
    window.history.replaceState({}, document.title, window.location.pathname);
    App.UI.showScreen('loading-screen');
    try {
        const { Place } = await google.maps.importLibrary("places");
        const p = new Place({ id: resId });
        // Fetch everything for shared links as it's just one request
        await p.fetchFields({ fields: [...BASIC_PLACE_FIELDS, ...DETAIL_PLACE_FIELDS] });
        const lat = App.Data.params.get('lat'), lng = App.Data.params.get('lng');
        if (lat && lng) App.Data.userPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
        const t = App.translations[App.currentLang];
        const restored = mapPlaceData(p, t);
        if (App.Data.userPos && restored.location) {
            const [withDuration] = await calculateDistances(App.Data.userPos, [restored]);
            restored.durationValue = withDuration.durationValue; // Fixed mapping
            restored.durationText = withDuration.durationText;
        }
        if (App.Data.userPos) {
            const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius);
            if (places && places.length > 0) App.Data.candidates = await processCandidates(places, App.Data.userPos, App);
        }
        App.UI.showResult(App, restored, { fromShare: true });
    } catch (e) { console.error("Session restoration failed:", e); App.UI.showScreen('main-flow'); }
}

/**
 * Cleanup expired cache entries from localStorage.
 * Runs asynchronously via requestIdleCallback to avoid blocking startup.
 */
export function cleanExpiredCache() {
    const runCleanup = () => {
        const now = Date.now();
        const TTL = 24 * 60 * 60 * 1000;
        let count = 0;

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('place_detail_')) {
                    try {
                        const cached = localStorage.getItem(key);
                        if (cached) {
                            const { timestamp } = JSON.parse(cached);
                            if (now - timestamp > TTL) {
                                localStorage.removeItem(key);
                                count++;
                                i--; // Adjust index after removal
                            }
                        }
                    } catch (e) {
                        localStorage.removeItem(key); // Remove malformed
                    }
                }
            }
        } catch (e) {
            console.warn("Garbage collection failed:", e);
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(runCleanup, { timeout: 5000 });
    } else {
        setTimeout(runCleanup, 2000);
    }
}
