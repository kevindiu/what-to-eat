/**
 * Helper to get element by ID
 * @param {string} id - The DOM element ID
 * @returns {HTMLElement | null} The element
 */
export const getEl = id => document.getElementById(id);

/**
 * Retrieves the user's current GPS coordinates as a Promise.
 * @param {Object} [options] - Optional PositionOptions.
 * @returns {Promise<GeolocationPosition>} Resulting position or error.
 */
export function getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("GEOLOCATION_NOT_SUPPORTED"));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
            ...options
        });
    });
}

/**
 * Delay helper
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export const sleep = ms => new Promise(r => setTimeout(r, ms));

import { CATEGORY_DEFINITIONS, GOOGLE_PLACE_TYPES, BROAD_PLACE_TYPES, CONSTANTS, PRICE_VAL_TO_KEY, PRICE_LEVEL_MAP } from './constants.js';

/**
 * Checks if a place matches a specific category using a tiered approach.
 * Tier 1: Match official Google Place types (High Confidence).
 * Tier 2: Match local keywords if the place type is generic/broad (Contextual Confidence).
 * Supports negative keywords for exclusion.
 * 
 * @param {Object} place - Internal place object.
 * @param {string} categoryId - The key from CATEGORY_DEFINITIONS.
 * @returns {boolean} True if matches.
 */
export function isPlaceMatch(place, categoryId) {
    const def = CATEGORY_DEFINITIONS[categoryId];
    if (!def) return false;

    const name = (place.name || "").toLowerCase();
    const types = place.types || [];

    if (def.googleTypes && def.googleTypes.length > 0) {
        if (types.some(t => def.googleTypes.includes(t))) return true;
    }

    const isBroad = types.length === 0 || types.some(t => BROAD_PLACE_TYPES.includes(t));

    // Some categories (like dim_sum) don't have specific Google types, 
    // so we always allow keyword matching for them if the place is a restaurant.
    const allowKeywords = isBroad || def.googleTypes.length === 0;

    if (allowKeywords) {
        if (def.negativeKeywords && def.negativeKeywords.some(nk => name.includes(nk.toLowerCase()))) {
            return false;
        }

        // Check all language keyword fields
        const langFields = ['zh_keywords', 'en_keywords', 'jp_keywords'];
        for (const field of langFields) {
            if (def[field] && def[field].some(k => name.includes(k.toLowerCase()))) {
                return true;
            }
        }
    }

    return false;
}
/**
 * Triggers a haptic feedback if supported by the device.
 * Only attempts on touch-enabled devices to avoid browser interventions on desktop.
 * @param {number|Array} duration - Duration of the vibration in ms.
 */
export function triggerHaptic(duration) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        // Only trigger if it's a touch device to avoid console warnings on desktop
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouch) return;

        try { navigator.vibrate(duration); } catch (e) { }
    }
}
/**
 * Generates a robust Google Maps search URL using place name and ID as a fallback.
 * @param {string} name - Restaurant name.
 * @param {string} id - Google Place ID.
 * @returns {string} The formatted URL.
 */
export function getGoogleMapsSearchUrl(name, id) {
    if (!name || !id) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${id}`;
}
/**
 * Fisher-Yates Shuffle algorithm to randomize an array in place.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Maps raw Google Place data to the internal flattened restaurant model.
 * Handles both API v1 and Legacy field names.
 * 
 * @param {Object} place - Raw Google Place object.
 * @param {Object} translations - Current localized strings.
 * @returns {Object} Unified restaurant object.
 */
export function mapPlaceData(place, translations) {
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
        googleMapsUri: place.googleMapsURI || place.googleMapsUri || place.googleMapsLinks?.placeURI || place.googleMapsLinks?.placeUri,
        reviewsUri: place.googleMapsLinks?.reviewsUri || place.googleMapsLinks?.reviewsURI,
        photosUri: place.googleMapsLinks?.photosUri || place.googleMapsLinks?.photosURI
    };
}

/**
 * Updates the local session history and candidate tracking.
 * @param {Object} data - App data object.
 * @param {Object} place - The currently selected place.
 */
export function updateHistory(data, place) {
    data.lastPickedId = place.id;
    if (!data.history) data.history = [];
    if (!data.history.includes(place.id)) {
        data.history.push(place.id);
    }
}

/**
 * Calculates a 5-point grid (Center + 4 Corners) for better coverage.
 * Google searchNearby (v1) only returns up to 20 results per call; 
 * a grid search helps uncover more candidates in dense areas.
 * 
 * @param {Object} location - Center point {lat, lng}.
 * @param {number} radius - Search radius in meters.
 * @returns {Array} Array of 5 location objects.
 */
export function getGridPoints(location, radius) {
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

/**
 * Resolves today's opening hours from Google's weekdayDescriptions array.
 * 
 * @param {Object} place - Current restaurant data.
 * @param {Object} translations - Localized strings.
 * @returns {string} Formatted hours string.
 */
export function getTodayHours(place, translations) {
    const descriptions = place.openingHours?.weekdayDescriptions;
    if (!descriptions || descriptions.length !== 7) return translations.noHoursInfo;

    const today = new Date();
    const dayNames = [
        today.toLocaleDateString('zh-HK', { weekday: 'long' }),
        today.toLocaleDateString('en-US', { weekday: 'long' }),
        today.toLocaleDateString('ja-JP', { weekday: 'long' })
    ];

    const match = descriptions.find(d => dayNames.some(name => d.includes(name))) || descriptions[(today.getDay() + 6) % 7];

    if (match) {
        const parts = match.split(/: |：/);
        return parts[1] ? parts[1].trim() : match;
    }
    return translations.noHoursInfo;
}

/**
 * Maps a numeric price level to a display string.
 * @param {number} level - Google price level (0-4).
 * @param {Object} translations - Localized strings.
 * @returns {string} Currency symbol string.
 */
export function getPriceDisplay(level, translations) {
    if (level === undefined || level === null) return "";
    let key = level;
    if (PRICE_VAL_TO_KEY[key]) key = PRICE_VAL_TO_KEY[key];
    const config = PRICE_LEVEL_MAP[key];
    return config ? config.label(translations) : "";
}

/**
 * Determines the primary category display name for a restaurant.
 * @param {Object} place - Internal restaurant object.
 * @param {Object} translations - Localized strings.
 * @returns {string|null} Localized category name.
 */
export function getPlaceCategory(place, translations) {
    const categoriesTranslations = translations.categories;
    for (const id of Object.keys(CATEGORY_DEFINITIONS)) {
        if (isPlaceMatch(place, id)) return categoriesTranslations[id] || id;
    }
    return null;
}

/**
 * Checks if a specific set of opening hours covers the current system time.
 * Correctly handles midnight wrap-around and 24/7 operations.
 * 
 * @param {Array} periods - Google Place opening periods array.
 * @returns {boolean|null} True if open, false if closed, null if no data.
 */
export function checkPeriodAvailability(periods) {
    if (!periods || !Array.isArray(periods) || periods.length === 0) return null;
    if (periods.length === 1 && !periods[0].close) return true; // Always open

    const now = new Date();
    const nowAbs = now.getDay() * 1440 + now.getHours() * 60 + now.getMinutes();
    const WEEK_MINUTES = 10080;

    for (const period of periods) {
        if (!period.open || !period.close) continue;
        const openAbs = Number(period.open.day) * 1440 + Number(period.open.hour) * 60 + Number(period.open.minute);
        let closeAbs = Number(period.close.day) * 1440 + Number(period.close.hour) * 60 + Number(period.close.minute);

        if (closeAbs <= openAbs) closeAbs += WEEK_MINUTES;

        if ((nowAbs >= openAbs && nowAbs < closeAbs) || (nowAbs + WEEK_MINUTES >= openAbs && nowAbs + WEEK_MINUTES < closeAbs)) {
            return true;
        }
    }
    return false;
}
