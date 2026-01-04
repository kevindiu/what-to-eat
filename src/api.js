import { getEl, getCurrentPosition, isPlaceMatch, triggerHaptic, shuffleArray, mapPlaceData, checkPeriodAvailability, getGridPoints } from './utils.js';
import { CATEGORY_DEFINITIONS, GOOGLE_PLACE_TYPES, ALWAYS_KEEP_SEARCH_TYPES, BASIC_PLACE_FIELDS, DETAIL_PLACE_FIELDS, PRICE_LEVEL_MAP, PRICE_VAL_TO_KEY, CONSTANTS } from './constants.js';
import { Cache } from './cache.js';

/**
 * The main entry point for the "Find Restaurant" flow.
 * Coordinates location retrieval, nearby search, candidate processing, 
 * and winner selection.
 * 
 * @param {Object} App - The global application control object.
 */
export async function findRestaurant(App) {
    triggerHaptic(50);
    App.UI.showScreen('loading-screen');
    App.Data.history = [];
    const translations = App.translations[App.currentLang];

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

        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        App.Data.currentPlace = await fetchPlaceDetails(Place, winner, App);

        App.UI.startSlotAnimation(App.Data.candidates, () => reRoll(App));
    } catch (error) {
        console.error("Search Error:", error);
        App.UI.handleError(error, App);
    }
}

/**
 * Performs a spatial search for nearby places using a grid-based approach.
 * Optimizes API quota by using early-exit logic and type grouping.
 * 
 * @param {Object} Place - The Google Maps Place library instance.
 * @param {Object} location - The center point {lat, lng}.
 * @param {number} radius - The search radius in meters.
 * @param {Object} App - The application control object.
 * @returns {Promise<Array>} A deduplicated list of raw Place objects.
 */
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
            maxResultCount: CONSTANTS.GOOGLE_MAPS_API_LIMIT,
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

    /**
     * Perform search across grid points and type groups with early-exit optimization.
     * 
     * Strategy:
     * 1. Search the center point first.
     * 2. Only for the FIRST randomized group, if saturated, search corners.
     * 3. For subsequent groups, only search the center to conserve quota.
     * 4. Overall Limit: Stop fetching once we have enough candidates (e.g., 60).
     */
    for (const [index, groups] of searchGroups.entries()) {
        if (!groups || groups.length === 0) continue;
        if (allPlaces.length >= CONSTANTS.SEARCH_CANDIDATE_LIMIT) break; // Quota Safeguard

        const centerResults = await fetchPoint(points[0], groups);
        processResults(centerResults);

        // If it's not the first group, we skip grid expansion to save costs.
        // We also skip if radius is very small (redundant overlap).
        const isSmallRadius = radius < 300;
        if (index > 0 || isSmallRadius || centerResults.length < CONSTANTS.GOOGLE_MAPS_API_LIMIT) continue;

        const diagonalResults = await Promise.all([
            fetchPoint(points[1], groups),
            fetchPoint(points[4], groups)
        ]);

        let newInPhase2 = 0;
        diagonalResults.forEach(res => {
            newInPhase2 += processResults(res);
        });

        // Early exit: if diagonals are empty, skip remaining corners
        if (newInPhase2 === 0 || allPlaces.length >= CONSTANTS.SEARCH_CANDIDATE_LIMIT) continue;

        const remainingResults = await Promise.all([
            fetchPoint(points[2], groups),
            fetchPoint(points[3], groups)
        ]);

        remainingResults.forEach(res => processResults(res));
    }

    return allPlaces;
}

/**
 * Generates batches of Google Place types to search for based on app filters.
 * Each batch is limited to 50 types to respect API constraints while maintaining diversity.
 * 
 * @param {Object} App - The application control object.
 * @returns {Array<Array<string>>} Shuffled groups of search types.
 */
function getSearchTypeGroups(App) {
    const searchGroups = [];
    const allTypes = GOOGLE_PLACE_TYPES;

    // Mode 1: Whitelist Optimization
    if (App.Config.filterMode === 'whitelist' && App.Config.excluded.size > 0) {
        const selectedTypes = new Set();
        App.Config.excluded.forEach(id => {
            const def = CATEGORY_DEFINITIONS[id];
            if (def && def.searchTypes) {
                def.searchTypes.forEach(t => {
                    if (GOOGLE_PLACE_TYPES.includes(t)) selectedTypes.add(t);
                });
            }
        });

        const typesArray = Array.from(selectedTypes);
        for (let i = 0; i < typesArray.length; i += 50) {
            searchGroups.push(typesArray.slice(i, i + 50));
        }
    }
    // Mode 2: Blacklist Optimization
    else if (App.Config.filterMode === 'blacklist' && App.Config.excluded.size > 0) {
        const blacklistCandidates = new Set();
        const mustKeep = new Set(ALWAYS_KEEP_SEARCH_TYPES);

        Object.keys(CATEGORY_DEFINITIONS).forEach(id => {
            const def = CATEGORY_DEFINITIONS[id];
            if (!def || !def.searchTypes) return;

            if (App.Config.excluded.has(id)) {
                // If category is excluded, its searchTypes are candidates for blacklisting
                def.searchTypes.forEach(t => blacklistCandidates.add(t));
            } else {
                // If category is ACTIVE, its searchTypes MUST be kept
                def.searchTypes.forEach(t => mustKeep.add(t));
            }
        });

        // Final blacklist: candidate types MINUS types required by active categories
        const finalBlacklist = new Set([...blacklistCandidates].filter(t => !mustKeep.has(t)));

        const activeTypes = allTypes.filter(t => !finalBlacklist.has(t));
        for (let i = 0; i < activeTypes.length; i += 50) {
            searchGroups.push(activeTypes.slice(i, i + 50));
        }
    }

    // Default Fallback
    if (searchGroups.length === 0) {
        for (let i = 0; i < allTypes.length; i += 50) {
            searchGroups.push(allTypes.slice(i, i + 50));
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
    const translations = App.translations[App.currentLang];

    const operational = await filterOperational(places, App, translations);

    const withinRange = await filterByDistance(userLoc, operational, App);

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
        const isMatch = selectedCategories.some(id => isPlaceMatch(place, id));

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

export async function fetchPlaceDetails(Place, basicPlace, App) {
    if (!basicPlace || !basicPlace.id) return basicPlace;

    const restorePhotoMethods = (photos) => {
        if (!photos) return photos;
        return photos.map(photo => ({
            ...photo,
            getURI: (options) => photo.cachedURI || ""
        }));
    };

    const cachedData = Cache.get(basicPlace.id);
    if (cachedData) {
        if (cachedData.photos) cachedData.photos = restorePhotoMethods(cachedData.photos);

        // Ensure distance/duration persists across cache hits
        const { durationText, durationValue } = basicPlace;
        const merged = { ...basicPlace, ...cachedData };
        if (durationText) merged.durationText = durationText;
        if (durationValue) merged.durationValue = durationValue;
        return merged;
    }

    try {
        const place = new Place({ id: basicPlace.id });
        // Must fetch BASIC + DETAIL fields to ensure mapPlaceData has everything it needs
        await place.fetchFields({ fields: [...BASIC_PLACE_FIELDS, ...DETAIL_PLACE_FIELDS] });

        const translations = App.translations[App.currentLang];
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

        // Preserve duration info which is calculated client-side and not available in Place details
        const { durationText, durationValue } = basicPlace;
        Object.assign(basicPlace, mapped);
        if (durationText) basicPlace.durationText = durationText;
        if (durationValue) basicPlace.durationValue = durationValue;

        Cache.set(basicPlace.id, mapped);

        if (basicPlace.photos) basicPlace.photos = restorePhotoMethods(basicPlace.photos);

    } catch (e) {
        console.error("Error fetching place details:", e);
    }
    return basicPlace;
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
    triggerHaptic([50, 30, 50]);
    if (App.Data.candidates.length === 0) return findRestaurant(App);

    let candidates = App.Data.candidates;
    if (candidates.length > 1) {
        const historyIds = new Set(App.Data.history || []);
        const others = candidates.filter(place => !historyIds.has(place.id));

        if (others.length > 0) {
            candidates = others;
        } else if (App.Data.lastPickedId) {
            const avoidLast = candidates.filter(place => place.id !== App.Data.lastPickedId);
            if (avoidLast.length > 0) candidates = avoidLast;
        }
    }

    let winner = candidates[Math.floor(Math.random() * candidates.length)];
    const { Place } = await google.maps.importLibrary("places");
    const detailedWinner = await fetchPlaceDetails(Place, winner, App);

    App.UI.showResult(detailedWinner, App.translations[App.currentLang], App.Config, App.Data);
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

        if (App.Data.userPos) {
            const places = await fetchNearby(Place, App.Data.userPos, App.Config.radius, App);
            if (places && places.length > 0) App.Data.candidates = await processCandidates(places, App.Data.userPos, App);
        }

        App.UI.showResult(restored, App.translations[App.currentLang], App.Config, App.Data, { fromShare: true });
    } catch (e) {
        console.error("Session restoration failed:", e);
        App.UI.handleError(e, App);
    }
}
