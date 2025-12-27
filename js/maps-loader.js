export function loadGoogleMaps(apiKey, language = 'zh-HK') {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            console.warn("Google Maps already loaded.");
            return resolve(window.google.maps);
        }

        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.google.maps));
            existingScript.addEventListener('error', (e) => reject(e));
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async&language=${language}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            if (window.google && window.google.maps) {
                resolve(window.google.maps);
            } else {
                reject(new Error("Google Maps loaded but window.google.maps is undefined"));
            }
        };

        script.onerror = (e) => reject(new Error("Failed to load Google Maps API"));

        document.head.appendChild(script);
    });
}
