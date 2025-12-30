import { getEl, getCurrentPosition, isPlaceMatch } from './utils.js';
import { CUISINE_MAPPING, GOOGLE_PLACE_TYPES, BASIC_PLACE_FIELDS, DETAIL_PLACE_FIELDS, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY, CONSTANTS } from './constants.js';



/**
 * Centalized mapping from Google Place object to internal restaurant model.
 */
function mapPlaceData(place, translations) {
    return {
        id: place.id || place.place_id,
        name: typeof place.displayName === 'string' ? place.displayName : (place.displayName?.text || translations.unknownName),
        rating: place.rating,
        userRatingCount: place.userRatingCount || 0,
        vicinity: place.formattedAddress || place.vicinity || translations.noAddress,
        types: place.types || [],
        priceLevel: place.priceLevel,
        phone: place.nationalPhoneNumber,
        businessStatus: place.businessStatus,
        location: place.location,
        openingHours: place.regularOpeningHours,
        isOpen: null,
        durationText: null,
        durationValue: null,
        photos: place.photos || [],
        reviews: place.reviews || [],
        googleMapsURI: place.googleMapsURI
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
        const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius, App);

        if (!places || places.length === 0) {
            alert(translations.noResults);
            App.UI.showScreen('main-flow');
            return;
        }

        const candidates = await processCandidates(places, App.Data.userPos, App);

        if (candidates.length === 0) {
            const errorMsg = App.Config.filterMode === 'whitelist' ? translations.noFilteredResultsWhitelist : translations.noFilteredResultsBlacklist;
            alert(errorMsg);
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
        handleError(error, translations, App);
    }
}

async function fetchNearby(Place, location, radius, App) {
    const points = getGridPoints(location, radius);
    const searchGroups = getSearchTypeGroups(App);

    const allPlaces = [];
    const seenIds = new Set();

    const fetchPoint = async (pos, types) => {
        const request = {
            locationRestriction: { center: pos, radius: radius },
            includedPrimaryTypes: types,
            fields: BASIC_PLACE_FIELDS,
            maxResultCount: 20,
            rankPreference: 'DISTANCE'
        };
        try {
            const { places } = await Place.searchNearby(request);
            return places || [];
        } catch (e) {
            console.warn("Fetch error:", e);
            return [];
        }
    };

    const processResults = (newPlaces) => {
        let addedCount = 0;
        newPlaces.forEach(place => {
            if (place && place.id && !seenIds.has(place.id)) {
                seenIds.add(place.id);
                allPlaces.push(place);
                addedCount++;
            }
        });
        return addedCount;
    };

    // Perform search across grid points and type groups with early-exit optimization
    for (const groups of searchGroups) {
        if (!groups || groups.length === 0) continue;

        // Phase 1: Search Center using ONLY active groups of types
        const centerResults = await fetchPoint(points[0], groups);
        processResults(centerResults);

        // If center point isn't saturated (returns < 20),
        // we assume the area is sparse and skip the corners to save API cost.
        if (centerResults.length < 20) continue;

        // Phase 2: Search 2 Diagonal Corners (Bottom-Left & Top-Right)
        const diagonalResults = await Promise.all([
            fetchPoint(points[1], groups),
            fetchPoint(points[4], groups)
        ]);

        let newInPhase2 = 0;
        diagonalResults.forEach(res => {
            newInPhase2 += processResults(res);
        });

        // If diagonals didn't yield ANY new unique locations,
        // assume we've covered the area effectively and skip the last 2 corners.
        if (newInPhase2 === 0) continue;

        // Phase 3: Search Remaining 2 Corners (Top-Left & Bottom-Right)
        const remainingResults = await Promise.all([
            fetchPoint(points[2], groups),
            fetchPoint(points[3], groups)
        ]);

        remainingResults.forEach(res => processResults(res));
    }

    return allPlaces;
}

function getGridPoints(location, radius) {
    const offset = radius * 0.6;
    const latOffset = offset / CONSTANTS.METERS_PER_DEGREE_LAT;
    const lngOffset = offset / (CONSTANTS.METERS_PER_DEGREE_LAT * Math.cos(location.lat * Math.PI / 180));

    return [
        { lat: location.lat, lng: location.lng }, // 0: Center
        { lat: location.lat - latOffset, lng: location.lng - lngOffset }, // 1: Bottom-Left
        { lat: location.lat + latOffset, lng: location.lng - lngOffset }, // 2: Top-Left
        { lat: location.lat - latOffset, lng: location.lng + lngOffset }, // 3: Bottom-Right
        { lat: location.lat + latOffset, lng: location.lng + lngOffset }  // 4: Top-Right
    ];
}

function getSearchTypeGroups(App) {
    const searchGroups = [];
    const allTypes = GOOGLE_PLACE_TYPES;

    // Mode 1: Whitelist Optimization
    if (App.Config.filterMode === 'whitelist' && App.Config.excluded.size > 0) {
        const selectedTypes = new Set();
        App.Config.excluded.forEach(id => {
            (CUISINE_MAPPING[id] || []).forEach(m => {
                if (GOOGLE_PLACE_TYPES.includes(m)) selectedTypes.add(m);
            });
        });

        const typesArray = Array.from(selectedTypes);
        for (let i = 0; i < typesArray.length; i += 20) {
            searchGroups.push(typesArray.slice(i, i + 20));
        }
    }
    // Mode 2: Blacklist Optimization
    else if (App.Config.filterMode === 'blacklist' && App.Config.excluded.size > 0) {
        const blacklist = new Set();
        App.Config.excluded.forEach(id => {
            (CUISINE_MAPPING[id] || []).forEach(m => {
                if (m.includes('_') || /^[a-z]+$/.test(m)) blacklist.add(m);
            });
        });

        const activeTypes = allTypes.filter(t => !blacklist.has(t));
        for (let i = 0; i < activeTypes.length; i += 20) {
            searchGroups.push(activeTypes.slice(i, i + 20));
        }
    }

    // Default Fallback
    if (searchGroups.length === 0) {
        for (let i = 0; i < allTypes.length; i += 20) {
            searchGroups.push(allTypes.slice(i, i + 20));
        }
    }
    return searchGroups;
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

    // 1. Map and check basic operability
    const operational = await filterOperational(places, App, t);

    // 2. Filter by range
    const withinRange = await filterByDistance(userLoc, operational, App);

    // 3. Final filter by categories and price
    return filterByPreferences(withinRange, App);
}

async function filterOperational(places, App, translations) {
    const candidates = await Promise.all(places.map(async place => {
        const item = mapPlaceData(place, translations);
        try { item.isOpen = await place.isOpen(); } catch (e) { item.isOpen = null; }

        if (item.isOpen === null) {
            item.isOpen = item.openingHours?.periods ? checkPeriodAvailability(item.openingHours.periods) : item.openingHours?.openNow;
        }
        return item;
    }));

    return candidates.filter(place => {
        if (place.businessStatus !== 'OPERATIONAL' && place.businessStatus) return false;
        return App.Config.includeClosed || place.isOpen !== false;
    });
}

async function filterByDistance(userLoc, candidates, App) {
    const withDurations = await calculateDistances(userLoc, candidates);
    let filtered = withDurations.filter(place => !place.durationValue || (place.durationValue / 60) <= App.Config.mins);

    // Fallback if everyone is too far
    if (filtered.length === 0) {
        filtered = withDurations.sort((a, b) => (a.durationValue || 9999) - (b.durationValue || 9999)).slice(0, 3);
    }
    return filtered;
}

function filterByPreferences(candidates, App) {
    return candidates.filter(place => {
        const selectedCategories = Array.from(App.Config.excluded);
        const isMatch = selectedCategories.some(id => isPlaceMatch(place, CUISINE_MAPPING[id]));

        if (App.Config.filterMode === 'whitelist') {
            if (selectedCategories.length > 0 && !isMatch) return false;
        } else {
            if (isMatch) return false;
        }

        if (place.priceLevel !== undefined && place.priceLevel !== null) {
            const key = PRICE_VAL_TO_KEY[place.priceLevel] || place.priceLevel;
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
    if (!basicPlace || !basicPlace.id) return basicPlace;

    const cacheKey = `place_detail_${basicPlace.id}`;
    const now = Date.now();
    const TTL = 24 * 60 * 60 * 1000; // 24 hours

    const restorePhotoMethods = (photos) => {
        if (!photos) return photos;
        return photos.map(photo => ({
            ...photo,
            getURI: (options) => photo.cachedURI || ""
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
        const place = new Place({ id: basicPlace.id });
        // Must fetch BASIC + DETAIL fields to ensure mapPlaceData has everything it needs
        await place.fetchFields({ fields: [...BASIC_PLACE_FIELDS, ...DETAIL_PLACE_FIELDS] });

        const mapped = mapPlaceData(place, translations);

        // Pre-fetch photo URIs because the getURI method is lost after JSON.stringify
        if (place.photos && place.photos.length > 0) {
            mapped.photos = place.photos.map(photo => ({
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

function handleError(error, translations, App) {
    if (error.message === "GEOLOCATION_NOT_SUPPORTED") alert(translations.noGeo);
    else if (error.code === 1) alert(translations.geoError);
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
        const others = candidates.filter(place => !historyIds.has(place.id));

        if (others.length > 0) {
            candidates = others;
        } else if (App.Data.lastPickedId) {
            // If everything has been seen, at least avoid the immediate last one
            const avoidLast = candidates.filter(place => place.id !== App.Data.lastPickedId);
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

    // Clear URL parameters immediately for a cleaner UX
    window.history.replaceState({}, document.title, window.location.pathname);
    App.UI.showScreen('loading-screen');

    try {
        const { Place } = await google.maps.importLibrary("places");
        const place = new Place({ id: resId });

        // Fetch exhaustive fields for shared links (single request)
        await place.fetchFields({ fields: [...BASIC_PLACE_FIELDS, ...DETAIL_PLACE_FIELDS] });

        const lat = parseFloat(App.Data.params.get('lat'));
        const lng = parseFloat(App.Data.params.get('lng'));
        if (!isNaN(lat) && !isNaN(lng)) {
            App.Data.userPos = { lat, lng };
        }

        const translations = App.translations[App.currentLang];
        const restored = mapPlaceData(place, translations);

        if (App.Data.userPos && restored.location) {
            const [withDuration] = await calculateDistances(App.Data.userPos, [restored]);
            restored.durationValue = withDuration.durationValue;
            restored.durationText = withDuration.durationText;
        }

        // Pre-fetch candidates in background if we have location
        if (App.Data.userPos) {
            const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius, App);
            if (places && places.length > 0) App.Data.candidates = await processCandidates(places, App.Data.userPos, App);
        }

        App.UI.showResult(App, restored, { fromShare: true });
    } catch (e) {
        console.error("Session restoration failed:", e);
        App.UI.showScreen('main-flow');
    }
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
