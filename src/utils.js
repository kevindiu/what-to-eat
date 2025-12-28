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
