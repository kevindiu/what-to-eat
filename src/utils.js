/**
 * Helper to get element by ID
 * @param {string} id - The DOM element ID
 * @returns {HTMLElement | null} The element
 */
export const getEl = id => document.getElementById(id);

/**
 * Promisified Geolocation
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

import { CATEGORY_DEFINITIONS, BROAD_PLACE_TYPES } from './constants.js';

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

    // 1. Tier 1: Google Official Type Match
    if (def.googleTypes && def.googleTypes.length > 0) {
        if (types.some(t => def.googleTypes.includes(t))) return true;
    }

    // 2. Tier 2: Keyword Match for Broad Types
    // We only rely on keywords if the official types don't provide a high-confidence match
    // OR if the place is marked with broad types like 'restaurant' or 'food'
    const isBroad = types.length === 0 || types.some(t => BROAD_PLACE_TYPES.includes(t));

    // Some categories (like dim_sum) don't have specific Google types, 
    // so we always allow keyword matching for them if the place is a restaurant.
    const allowKeywords = isBroad || def.googleTypes.length === 0;

    if (allowKeywords) {
        // First check negative keywords
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
