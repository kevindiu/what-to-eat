import { getEl } from './ui.js';
import { CUISINE_MAPPING } from './constants.js';

export async function findRestaurant(App, translations, currentLang) {
    App.UI.triggerHaptic(50);
    App.UI.showScreen('loading-screen');
    const t = translations[currentLang];

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    if (!navigator.geolocation) {
        alert(t.noGeo);
        App.UI.showScreen('main-flow');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        App.Data.userPos = { lat: latitude, lng: longitude };
        const userLoc = App.Data.userPos;

        try {
            const { Place } = await google.maps.importLibrary("places");

            const request = {
                locationRestriction: {
                    center: userLoc,
                    radius: App.Config.radius
                },
                includedPrimaryTypes: ["restaurant"],
                fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"],
                maxResultCount: 20,
                rankPreference: 'POPULARITY'
            };

            const { places } = await Place.searchNearby(request);
            console.log("Found places:", places);

            if (places && places.length > 0) {
                const resultsWithStatus = await Promise.all(places.map(async p => {
                    let isOpenStatus = null;
                    try {
                        isOpenStatus = await p.isOpen();
                    } catch (e) {
                        isOpenStatus = p.regularOpeningHours?.openNow;
                    }

                    let name = "Unknown";
                    if (p.displayName) {
                        name = typeof p.displayName === 'string' ? p.displayName : (p.displayName.text || "Unknown");
                    }

                    return {
                        name: name,
                        rating: p.rating,
                        userRatingCount: p.userRatingCount,
                        vicinity: p.formattedAddress || p.vicinity || "地址不詳",
                        place_id: p.id || p.place_id,
                        types: p.types || [],
                        isOpen: isOpenStatus,
                        priceLevel: p.priceLevel,
                        phone: p.nationalPhoneNumber,
                        businessStatus: p.businessStatus,
                        location: p.location
                    };
                }));

                const results = resultsWithStatus.filter(p => {
                    const isActuallyOpen = p.isOpen === true;
                    const isOperational = p.businessStatus === 'OPERATIONAL' || p.businessStatus === undefined;
                    return isActuallyOpen && isOperational;
                });

                let candidates = results;
                if (candidates.length === 0) {
                    candidates = resultsWithStatus.filter(p => p.businessStatus === 'OPERATIONAL' || p.businessStatus === undefined);
                }

                if (candidates.length === 0) {
                    alert(t.noResults);
                    App.UI.showScreen('main-flow');
                    return;
                }

                const candidatesWithDurations = await calculateDistances(userLoc, candidates);

                let filteredByTime = candidatesWithDurations.filter(p => {
                    if (p.durationValue === null) return true;
                    return (p.durationValue / 60) <= App.Config.mins;
                });

                if (filteredByTime.length === 0) {
                    filteredByTime = candidatesWithDurations.sort((a, b) => (a.durationValue || 9999) - (b.durationValue || 9999)).slice(0, 3);
                }

                const finalFiltered = filteredByTime.filter(place => {
                    const placeTypes = place.types || [];
                    const name = (place.name || "").toLowerCase();

                    const matchedExcluded = Array.from(App.Config.excluded).some(id => {
                        const keywords = CUISINE_MAPPING[id] || [];
                        return keywords.some(k => name.includes(k) || placeTypes.some(pt => pt.toLowerCase().includes(k)));
                    });

                    if (matchedExcluded) return false;

                    if (place.priceLevel) {
                        const levelMap = {
                            'PRICE_LEVEL_INEXPENSIVE': '1',
                            'PRICE_LEVEL_MODERATE': '2',
                            'PRICE_LEVEL_EXPENSIVE': '3',
                            'PRICE_LEVEL_VERY_EXPENSIVE': '4'
                        };
                        const mapped = levelMap[place.priceLevel];
                        if (mapped && !App.Config.prices.has(mapped)) return false;
                    }

                    return true;
                });

                if (finalFiltered.length === 0) {
                    alert(t.noResults + " (Try adjusting filters)");
                    App.UI.showScreen('main-flow');
                    return;
                }

                App.Data.candidates = finalFiltered;
                startSlotAnimation(App);
            } else {
                alert(t.noResults);
                App.UI.showScreen('main-flow');
            }
        } catch (error) {
            console.error("Google Places Error:", error);
            alert("Google Maps API Error");
            App.UI.showScreen('main-flow');
        }
    }, (error) => {
        console.error("Geo Error:", error);
        alert(t.geoError);
        App.UI.showScreen('main-flow');
    }, geoOptions);
}

export async function calculateDistances(origin, destinations) {
    const service = new google.maps.DistanceMatrixService();
    const destCoords = destinations.map(d => d.location);

    return new Promise((resolve) => {
        service.getDistanceMatrix({
            origins: [origin],
            destinations: destCoords,
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status !== "OK") {
                resolve(destinations.map(d => ({ ...d, durationText: null, durationValue: null })));
                return;
            }

            const results = response.rows[0].elements;
            const enhanced = destinations.map((d, i) => {
                const element = results[i];
                return {
                    ...d,
                    durationText: element.status === "OK" ? element.duration.text : null,
                    durationValue: element.status === "OK" ? element.duration.value : null
                };
            });
            resolve(enhanced);
        });
    });
}

export function startSlotAnimation(App) {
    const slotName = getEl('slot-name');
    let count = 0;
    const interval = setInterval(() => {
        const temp = App.Data.candidates[Math.floor(Math.random() * App.Data.candidates.length)];
        slotName.textContent = temp.name;
        count++;
        if (count > 15) {
            clearInterval(interval);
            reRoll(App, App.translations, App.currentLang);
        }
    }, 100);
}

export async function reRoll(App, translations, currentLang) {
    App.UI.triggerHaptic([50, 30, 50]);
    if (App.Data.candidates.length === 0) {
        findRestaurant(App, translations, currentLang);
        return;
    }

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
            await p.fetchFields({
                fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"]
            });
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
            console.error("Failed to fetch candidate details:", e);
        }
    }

    displayResult(App, translations, currentLang, randomPlace);
}

export async function displayResult(App, translations, currentLang, place) {
    App.Data.lastPickedId = place.place_id;
    getEl('res-name').textContent = place.name;

    const ratingVal = place.rating;
    const resRatingEl = getEl('res-rating');
    if (typeof ratingVal === 'number' && ratingVal > 0) {
        resRatingEl.textContent = `⭐ ${ratingVal}`;
    } else {
        resRatingEl.textContent = "⭐ New!";
    }

    const priceText = getPriceDisplay(place.priceLevel);
    const resPriceEl = getEl('res-price');
    resPriceEl.textContent = priceText;
    resPriceEl.style.display = priceText ? 'inline-block' : 'none';

    const cat = getPlaceCategory(place, translations, currentLang);
    const resCatEl = getEl('res-category');
    resCatEl.textContent = cat || "";
    resCatEl.style.display = cat ? 'inline-block' : 'none';

    getEl('res-address').textContent = place.vicinity;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const mapDiv = getEl('res-map-container');
    const loc = place.location;

    if (loc) {
        try {
            const [{ Map }, { Marker }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("marker")
            ]);

            const map = new Map(mapDiv, {
                center: loc,
                zoom: 16,
                disableDefaultUI: false,
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy'
            });

            new Marker({ position: loc, map: map, title: place.name, animation: google.maps.Animation.DROP });

            if (App.Data.userPos) {
                new Marker({
                    position: App.Data.userPos,
                    map: map,
                    title: "Your Location",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white",
                    }
                });
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(loc);
                bounds.extend(App.Data.userPos);
                map.fitBounds(bounds, 50);
            }
            mapDiv.style.display = 'block';
        } catch (e) {
            console.error("Map Error:", e);
            mapDiv.style.display = 'none';
        }
    } else {
        mapDiv.style.display = 'none';
    }

    const phoneEl = getEl('res-phone');
    if (place.phone) {
        phoneEl.textContent = place.phone;
        phoneEl.href = `tel:${place.phone.replace(/\s+/g, '')}`;
        phoneEl.style.display = 'block';
    } else {
        phoneEl.style.display = 'none';
    }

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    getEl('open-maps-btn').href = mapLink;

    if (place.durationText) {
        resRatingEl.textContent += `  •  🚶 ${place.durationText}`;
    }

    App.UI.showScreen('result-screen');
    App.UI.triggerConfetti();
}

export function getPlaceCategory(place, translations, currentLang) {
    const t = translations[currentLang].categories;
    const placeTypes = place.types || [];
    const name = (place.name || "").toLowerCase();

    for (const [id, keywords] of Object.entries(CUISINE_MAPPING)) {
        if (keywords.some(k => name.includes(k) || placeTypes.some(pt => pt.toLowerCase().includes(k)))) {
            return t[id];
        }
    }
    return null;
}

export function getPriceDisplay(level) {
    if (level === undefined || level === null || level < 0) return "";
    const mapping = {
        'PRICE_LEVEL_FREE': 'Free',
        'PRICE_LEVEL_INEXPENSIVE': '$',
        'PRICE_LEVEL_MODERATE': '$$',
        'PRICE_LEVEL_EXPENSIVE': '$$$',
        'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
    };
    return mapping[level] || "";
}

export async function restoreSession(App, translations, currentLang) {
    const resId = App.Data.params.get('resId');
    const lat = App.Data.params.get('lat');
    const lng = App.Data.params.get('lng');

    if (!resId) return;

    window.history.replaceState({}, document.title, window.location.pathname);
    App.UI.showScreen('loading-screen');

    try {
        const { Place } = await google.maps.importLibrary("places");
        const place = new Place({ id: resId });
        await place.fetchFields({
            fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"]
        });

        const restoredPlace = {
            name: place.displayName?.text || place.displayName || "Unknown",
            rating: place.rating,
            userRatingCount: place.userRatingCount,
            vicinity: place.formattedAddress || "地址不詳",
            place_id: place.id,
            types: place.types || [],
            priceLevel: place.priceLevel,
            phone: place.nationalPhoneNumber,
            businessStatus: place.businessStatus,
            location: place.location
        };

        if (lat && lng) {
            App.Data.userPos = { lat: parseFloat(lat), lng: parseFloat(lng) };
        }

        displayResult(App, translations, currentLang, restoredPlace);
    } catch (e) {
        console.error("Session restoration failed:", e);
        App.UI.showScreen('main-flow');
    }
}
