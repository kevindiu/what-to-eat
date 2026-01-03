export const Cache = {
    TTL: 24 * 60 * 60 * 1000,

    get(resId) {
        try {
            const cached = localStorage.getItem(`place_detail_${resId}`);
            if (!cached) return null;
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > this.TTL) {
                localStorage.removeItem(`place_detail_${resId}`);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    },

    set(resId, data) {
        try {
            localStorage.setItem(`place_detail_${resId}`, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn("Storage Full:", e);
        }
    },

    clean() {
        const runCleanup = () => {
            const now = Date.now();
            let count = 0;
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('place_detail_')) {
                        try {
                            const cached = localStorage.getItem(key);
                            if (cached) {
                                const { timestamp } = JSON.parse(cached);
                                if (now - timestamp > this.TTL) {
                                    localStorage.removeItem(key);
                                    count++;
                                    i--;
                                }
                            }
                        } catch (e) {
                            localStorage.removeItem(key);
                        }
                    }
                }
            } catch (e) { }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(runCleanup, { timeout: 5000 });
        } else {
            setTimeout(runCleanup, 2000);
        }
    }
};

/**
 * Manual Image Cache utility using the browser's Cache API.
 * This ensures that restaurant photos are only downloaded once and served locally.
 */
export const ImageCache = {
    CACHE_NAME: 'restaurant-photos-v1',

    /**
     * Attempts to get a locally usable URL for an image.
     * If cached, returns a blob URL. If not, fetches, caches, and then returns a blob URL.
     * @param {string} url - The remote image URL.
     * @returns {Promise<string>} - A promise that resolves to a usable URL (local or remote).
     */
    async getCachedUrl(url) {
        if (!url || typeof url !== 'string') return url;

        // Skip non-external images or base64
        if (!url.startsWith('http')) return url;

        try {
            const cache = await caches.open(this.CACHE_NAME);
            const cachedResponse = await cache.match(url);

            if (cachedResponse) {
                const blob = await cachedResponse.blob();
                return URL.createObjectURL(blob);
            }

            // Not in cache, fetch it
            const response = await fetch(url, {
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) throw new Error('Network response was not ok');

            // Clone the response to store in cache
            const responseToCache = response.clone();
            await cache.put(url, responseToCache);

            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } catch (error) {
            console.warn('ImageCache failed, falling back to remote URL:', error);
            return url;
        }
    }
};
