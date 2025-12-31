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
