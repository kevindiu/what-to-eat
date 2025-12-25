console.log("食乜好 App v2.22 - Clean Modular Architecture");
const translations = {
    zh: {
        title: "食乜好？",
        subtitle: "唔知食咩？等我幫你揀！",
        distanceTitle: "想搵徒步幾耐？",
        priceTitle: "價錢預算？",
        filterTitle: "今日唔想食咩？",
        findBtn: "幫我揀！✨",
        openMaps: "喺 Google Maps 打開 🗺️",
        retry: "唔多中意？抽過間！",
        backBtn: "返去主頁",
        loading: "搜尋緊附近好嘢食... 🔍",
        noResults: "附近搵唔到開門嘅餐廳，試下搵遠啲？",
        geoError: "拎唔到你個位置，請檢查下權限。📍",
        noGeo: "你個瀏覽器唔支援取用地理位置。",
        installBtn: "安裝 App 📲",
        iosInstallText: "撳底部「分享」掣再揀「加入主畫面」就得喇！✨",
        categories: {
            chinese: '🍚 中餐',
            japanese: '🍣 日本菜',
            korean: '🇰🇷 韓國菜',
            western: '🍕 西餐',
            se_asian: '� 東南亞',
            noodles: '🍜 粉麵',
            spicy: '🌶️ 辣嘢',
            hotpot_bbq: '🔥 火鍋/燒烤',
            dim_sum: '🥟 點心/飲茶',
            dessert: '� 甜品/糖水',
            fast_food: '🍔 快餐/小食',
            cafe_light: '☕ 咖啡/輕食'
        }
    },
    en: {
        title: "What to Eat?",
        subtitle: "Don't know? Let me pick!",
        distanceTitle: "Walking Distance",
        priceTitle: "Price Range",
        filterTitle: "What do you NOT want to eat?",
        findBtn: "Pick for me! ✨",
        openMaps: "Open in Google Maps 🗺️",
        retry: "Not this one? Re-roll!",
        backBtn: "Back to Home",
        loading: "Searching for delicious food... 🔍",
        noResults: "No open restaurants found nearby. Try moving a bit?",
        geoError: "Unable to find location. Check permissions.",
        noGeo: "Geolocation not supported by this browser.",
        installBtn: "Install App 📲",
        iosInstallText: "Tap 'Share' and then 'Add to Home Screen'! ✨",
        categories: {
            chinese: '🍚 Chinese',
            japanese: '🍣 Japanese',
            korean: '🇰🇷 Korean',
            western: '🍕 Western',
            se_asian: '� SE Asian',
            noodles: '🍜 Noodles',
            spicy: '🌶️ Spicy',
            hotpot_bbq: '🔥 Hotpot/BBQ',
            dim_sum: '🥟 Dim Sum',
            dessert: '� Dessert',
            fast_food: '🍔 Fast Food',
            cafe_light: '☕ Cafe/Light'
        }
    },
    ja: {
        title: "何食べる？",
        subtitle: "迷ったら、私に選ばせて！",
        distanceTitle: "徒歩何分？",
        priceTitle: "予算は？",
        filterTitle: "今は食べたくないものは？",
        findBtn: "選んで！ ✨",
        openMaps: "Googleマップで開く 🗺️",
        retry: "他のがいい！",
        backBtn: "ホームに戻る",
        loading: "近くの美味しい店を探しています... 🔍",
        noResults: "近くに営業中の店が見つかりません。",
        geoError: "位置情報を取得できません。設定を確認してください。",
        noGeo: "お使いのブラウザは位置情報をサポートしていません。",
        installBtn: "アプリをインストール 📲",
        iosInstallText: "「共有」から「ホーム画面に追加」をタップしてください！ ✨",
        categories: {
            chinese: '🍚 中華料理',
            japanese: '🍣 日本料理',
            korean: '🇰🇷 韓国料理',
            western: '🍕 洋食',
            se_asian: '� 東南アジア',
            noodles: '🍜 麺類',
            spicy: '🌶️ 辛い料理',
            hotpot_bbq: '🔥 火鍋/焼肉',
            dim_sum: '🥟 点心',
            dessert: '� デザート',
            fast_food: '🍔 ファストフード',
            cafe_light: '☕ カフェ/軽食'
        }
    }
};
const CUISINE_MAPPING = {
    chinese: ['chinese', 'cantonese', '中', '粵', '點心'],
    japanese: ['japanese', 'sushi', 'ramen', '日本', '壽司', '拉麵'],
    korean: ['korean', '韓國'],
    western: ['steak', 'italian', 'french', 'burger', 'pasta', 'western', '意', '法', '漢堡'],
    se_asian: ['thai', 'vietnamese', 'malaysian', '泰', '越', '星', '馬', '東南亞'],
    noodles: ['noodle', 'ramen', 'udon', '米線', '拉麵', '麵', '粉'],
    spicy: ['spicy', 'sichuan', 'mala', 'chili', '四川', '麻辣', '湘', '辣', '水煮'],
    hotpot_bbq: ['hot pot', 'hotpot', 'bbq', 'barbecue', 'yakiniku', '火鍋', '雞煲', '燒肉', '韓燒', '燒烤'],
    dim_sum: ['dim sum', 'yum cha', '點心', '飲茶'],
    dessert: ['dessert', 'sugar', 'sweet', '糖水', '甜', '雪糕', '冰'],
    fast_food: ['fast food', 'mcdonald', 'kfc', '快餐', '街頭小食', '小食'],
    cafe_light: ['cafe', 'coffee', 'sandwich', 'salad', '輕食', '咖啡', '三文治', '沙律']
};

// --- App Core Configuration & State ---
const App = {
    Config: {
        mins: parseInt(localStorage.getItem('currentMins') || '5'),
        get radius() { return this.mins * 80; },
        excluded: new Set(JSON.parse(localStorage.getItem('excludedTypes') || '[]')),
        prices: new Set(JSON.parse(localStorage.getItem('selectedPrices') || '["1","2","3","4"]')),
        lang: (function () {
            const saved = localStorage.getItem('preferredLang');
            if (saved) return saved;
            const userLang = navigator.language || navigator.userLanguage;
            if (userLang.startsWith('ja')) return 'ja';
            if (userLang.startsWith('zh')) return 'zh';
            return 'en';
        })()
    },
    Data: {
        userPos: null,
        candidates: [],
        lastPickedId: null,
        params: new URLSearchParams(window.location.search)
    },

    // --- Persistence ---
    // --- UI Methods ---
    UI: {
        showScreen(screenId) {
            ['main-flow', 'result-screen', 'loading-screen'].forEach(id => {
                const el = getEl(id);
                if (el) el.classList.add('hidden');
            });
            const target = getEl(screenId);
            if (target) target.classList.remove('hidden');
        },

        updateStrings() {
            const t = translations[currentLang];
            getEl('app-title').textContent = t.title;
            getEl('app-subtitle').textContent = t.subtitle;
            getEl('distance-title').innerHTML = `${t.distanceTitle} (<span id="distance-val">${App.Config.mins}</span> mins)`;
            getEl('price-title').textContent = t.priceTitle;
            getEl('filter-title').textContent = t.filterTitle;
            getEl('find-btn').textContent = t.findBtn;
            getEl('retry-btn').textContent = t.retry;
            getEl('back-btn').textContent = t.backBtn;
            getEl('loading-text').textContent = t.loading;
            if (getEl('open-maps-btn')) getEl('open-maps-btn').textContent = t.openMaps;
            if (getEl('install-btn')) getEl('install-btn').textContent = t.installBtn;

            document.querySelectorAll('.lang-selector span').forEach(span => {
                span.classList.toggle('active', span.dataset.lang === currentLang);
            });
        },

        initFilters() {
            const list = getEl('filter-list');
            if (list) {
                list.innerHTML = '';
                const cats = translations[currentLang].categories;
                Object.keys(cats).forEach(id => {
                    const div = document.createElement('div');
                    div.className = 'filter-item' + (App.Config.excluded.has(id) ? ' active' : '');
                    div.textContent = cats[id];
                    div.onclick = () => {
                        div.classList.toggle('active');
                        if (App.Config.excluded.has(id)) App.Config.excluded.delete(id);
                        else App.Config.excluded.add(id);
                        App.saveSettings();
                        App.UI.triggerHaptic(30);
                    };
                    list.appendChild(div);
                });
            }

            document.querySelectorAll('.price-item').forEach(item => {
                const p = item.dataset.price;
                item.classList.toggle('active', App.Config.prices.has(p));
                item.onclick = () => {
                    item.classList.toggle('active');
                    if (App.Config.prices.has(p)) App.Config.prices.delete(p);
                    else App.Config.prices.add(p);
                    App.saveSettings();
                    App.UI.triggerHaptic(30);
                };
            });
        },

        triggerHaptic(duration) {
            if (navigator.vibrate) navigator.vibrate(duration || 30);
        },

        triggerConfetti() {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#ff6b81', '#ffd32a', '#2ecc71', '#3498db']
                });
            }
        }
    },

    // --- PWA Logic ---
    PWA: {
        deferredPrompt: null,
        init() {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('./sw.js?v=2.22')
                        .then(() => console.log('SW registered!'))
                        .catch(err => console.log('SW failed', err));
                });
            }
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                if (getEl('install-container') && !this.isIOS()) {
                    getEl('install-container').classList.remove('hidden');
                }
            });
            window.addEventListener('appinstalled', () => {
                this.deferredPrompt = null;
                if (getEl('install-container')) getEl('install-container').classList.add('hidden');
            });

            const btn = getEl('install-btn');
            if (btn) {
                btn.addEventListener('click', () => this.handleInstall());
                if (this.isIOS() && !this.isStandalone()) {
                    getEl('install-container').classList.remove('hidden');
                    btn.innerHTML = `<span>${translations[currentLang].iosInstallText}</span>`;
                    btn.classList.add('ios-guide');
                }
            }
        },
        isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream; },
        isStandalone() { return window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches; },
        async handleInstall() {
            if (!this.deferredPrompt) return;
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            this.deferredPrompt = null;
            if (getEl('install-container')) getEl('install-container').classList.add('hidden');
        }
    },

    saveSettings() {
        localStorage.setItem('currentMins', this.Config.mins.toString());
        localStorage.setItem('selectedPrices', JSON.stringify(Array.from(this.Config.prices)));
        localStorage.setItem('excludedTypes', JSON.stringify(Array.from(this.Config.excluded)));
    },

    setLanguage(lang) {
        if (this.Config.lang === lang) return;
        localStorage.setItem('preferredLang', lang);
        this.saveSettings();

        let url = window.location.pathname + '?lang=' + lang;
        if (!getEl('result-screen').classList.contains('hidden') && this.Data.lastPickedId) {
            url += '&resId=' + this.Data.lastPickedId;
            if (this.Data.userPos) url += `&lat=${this.Data.userPos.lat}&lng=${this.Data.userPos.lng}`;
        }
        window.location.href = url;
    },

    init() {
        this.UI.updateStrings();
        this.UI.initFilters();
        this.PWA.init();
        restoreSession();
    }
};

const getEl = id => document.getElementById(id);
let currentLang = App.Config.lang;
window.setLanguage = (lang) => App.setLanguage(lang);


async function findRestaurant() {
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
            /** 
             * NOTE on Error: Failed to load resource: the server responded with a status of 500 (gen_204)
             * This error is often an internal Google Maps CSP (Content Security Policy) test or connectivity ping.
             * It usually DOES NOT affect the actual Places search functionality.
             */
            // Import Place library
            const { Place } = await google.maps.importLibrary("places");

            const request = {
                locationRestriction: {
                    center: userLoc,
                    radius: App.Config.radius
                },
                includedPrimaryTypes: ["restaurant"],
                fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"],
                maxResultCount: 20,
                // Using POPULARITY instead of DISTANCE to get a more diverse set of distances.
                // Distance ranking tends to return 20 results all within <5-10 mins in dense cities.
                rankPreference: 'POPULARITY'
            };

            const { places } = await Place.searchNearby(request);
            console.log("Found places (Popularity Ranked):", places);

            if (places && places.length > 0) {
                // Use Promise.all with async mapping to check isOpen() strictly for the New Places API
                const resultsWithStatus = await Promise.all(places.map(async p => {
                    let isOpenStatus = null;
                    try {
                        isOpenStatus = await p.isOpen(); // Accurate check for current time
                    } catch (e) {
                        console.warn("Open check failed for:", p.id);
                        isOpenStatus = p.regularOpeningHours?.openNow; // Fallback to property if method fails
                    }

                    // Resilience: handle different forms of displayName
                    let name = "Unknown";
                    if (p.displayName) {
                        if (typeof p.displayName === 'string') {
                            name = p.displayName;
                        } else if (p.displayName.text) {
                            name = p.displayName.text;
                        } else {
                            try { name = p.displayName.toString(); } catch (e) { }
                        }
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

                // Filter out restaurants that are NOT strictly open OR NOT operational
                console.log("Results with status before filter:", resultsWithStatus.map(r => ({ name: r.name, isOpen: r.isOpen, status: r.businessStatus })));

                const results = resultsWithStatus.filter(p => {
                    // Strict filtering: must be explicitly true and operational
                    const isActuallyOpen = p.isOpen === true;
                    const isOperational = p.businessStatus === 'OPERATIONAL' || p.businessStatus === undefined;
                    return isActuallyOpen && isOperational;
                });

                console.log("Filtered results (Strictly Open):", results.map(r => r.name));

                // Fallback for late night testing: If NO open restaurants found, show all operational ones
                let candidates = results;
                if (candidates.length === 0) {
                    console.log("No open restaurants found. Falling back to all operational shops for testing purposes.");
                    candidates = resultsWithStatus.filter(p => p.businessStatus === 'OPERATIONAL' || p.businessStatus === undefined);
                }

                if (candidates.length === 0) {
                    alert(t.noResults);
                    App.UI.showScreen('main-flow');
                    return;
                }

                // High-accuracy distance filtering using Distance Matrix
                const candidatesWithDurations = await calculateDistances(userLoc, candidates);

                // Filter by actual minutes
                let filteredByTime = candidatesWithDurations.filter(p => {
                    if (p.durationValue === null) return true; // Keep if calculation failed to avoid hiding results
                    return (p.durationValue / 60) <= App.Config.mins;
                });

                // If everything is filtered out by strict walking time, show closest few
                if (filteredByTime.length === 0) {
                    console.log("Everything filtered by strict walking time. Showing closest 3.");
                    filteredByTime = candidatesWithDurations.sort((a, b) => (a.durationValue || 9999) - (b.durationValue || 9999)).slice(0, 3);
                }

                // Final category/price filtering
                const finalFiltered = filteredByTime.filter(place => {
                    const placeTypes = place.types || [];
                    const name = (place.name || "").toLowerCase();

                    const matchedExcluded = Array.from(App.Config.excluded).some(id => {
                        const mapping = CUISINE_MAPPING;
                        const keywords = mapping[id] || [];
                        return keywords.some(k => name.includes(k) || placeTypes.some(pt => pt.toLowerCase().includes(k)));
                    });

                    if (matchedExcluded) return false;

                    // Price filter
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
                startSlotAnimation();
            } else {
                alert(t.noResults);
                App.UI.showScreen('main-flow');
            }
        } catch (error) {
            console.error("Google Places Error:", error);
            alert("Google Maps API Error: Check billing/API restrictions.");
            App.UI.showScreen('main-flow');
        }
    }, (error) => {
        console.error("Geo Error:", error);
        alert(t.geoError);
        App.UI.showScreen('main-flow');
    }, geoOptions);
}

async function calculateDistances(origin, destinations) {
    const service = new google.maps.DistanceMatrixService();
    // Chunk destinations (Google limit is 25 per request, we have max 20 usually)
    const destCoords = destinations.map(d => d.location);

    return new Promise((resolve) => {
        service.getDistanceMatrix({
            origins: [origin],
            destinations: destCoords,
            travelMode: google.maps.TravelMode.WALKING,
            unitSystem: google.maps.UnitSystem.METRIC,
        }, (response, status) => {
            if (status !== "OK") {
                console.warn("Distance Matrix failed:", status);
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


function startSlotAnimation() {
    const slotName = getEl('slot-name');
    let count = 0;
    const interval = setInterval(() => {
        const temp = App.Data.candidates[Math.floor(Math.random() * App.Data.candidates.length)];
        slotName.textContent = temp.name;
        count++;
        if (count > 15) {
            clearInterval(interval);
            reRoll();
        }
    }, 100);
}

async function reRoll() {
    App.UI.triggerHaptic([50, 30, 50]);
    if (App.Data.candidates.length === 0) {
        findRestaurant();
        return;
    }

    // Ensure we pick a different restaurant if more than one option exists
    let candidates = App.Data.candidates;
    if (candidates.length > 1 && App.Data.lastPickedId) {
        const others = candidates.filter(p => p.place_id !== App.Data.lastPickedId);
        if (others.length > 0) candidates = others;
    }

    let randomPlace = candidates[Math.floor(Math.random() * candidates.length)];

    // If it's a skeleton from restoreSession (missing full details), fetch them now
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
            // Update the stored list so we don't have to fetch this one again
            const idx = App.Data.candidates.findIndex(item => item.place_id === randomPlace.place_id);
            if (idx !== -1) App.Data.candidates[idx] = randomPlace;
        } catch (e) {
            console.error("Failed to fetch candidate details during re-roll:", e);
        }
    }

    displayResult(randomPlace);
}

function getPlaceCategory(place) {
    const t = translations[currentLang].categories;
    const placeTypes = place.types || [];
    const name = (place.name || "").toLowerCase();

    const mapping = CUISINE_MAPPING;

    for (const [id, keywords] of Object.entries(mapping)) {
        if (keywords.some(k => name.includes(k) || placeTypes.some(pt => pt.toLowerCase().includes(k)))) {
            return t[id];
        }
    }
    return null;
}

function getPriceDisplay(level) {
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

async function displayResult(place) {
    App.Data.lastPickedId = place.place_id;
    getEl('res-name').textContent = place.name;

    // Rating display logic
    const ratingVal = place.rating;

    if (typeof ratingVal === 'number' && ratingVal > 0) {
        getEl('res-rating').textContent = `⭐ ${ratingVal}`;
    } else {
        getEl('res-rating').textContent = "⭐ New!";
    }
    const priceText = getPriceDisplay(place.priceLevel);
    getEl('res-price').textContent = priceText;
    getEl('res-price').style.display = priceText ? 'inline-block' : 'none';

    const cat = getPlaceCategory(place);
    getEl('res-category').textContent = cat || "";
    getEl('res-category').style.display = cat ? 'inline-block' : 'none';

    getEl('res-address').textContent = place.vicinity;

    // Scroll to top of the result screen/window
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Map Preview (Dynamic Map)
    const mapDiv = getEl('res-map-container');
    const loc = place.location;

    if (loc) {
        try {
            console.log("Initializing v2.3 Interactive Map for:", place.name);
            const [{ Map }, { Marker }] = await Promise.all([
                google.maps.importLibrary("maps"),
                google.maps.importLibrary("marker")
            ]);

            const map = new Map(mapDiv, {
                center: loc,
                zoom: 16,
                disableDefaultUI: false, // Enable UI for better "moveable" feel
                mapTypeControl: false,
                streetViewControl: false,
                gestureHandling: 'greedy' // Fully unlocked
            });

            // Restaurant Marker (Red)
            new Marker({
                position: loc,
                map: map,
                title: place.name,
                animation: google.maps.Animation.DROP
            });

            // User Location Marker (Blue Dot)
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

                // Force bounds to show both
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(loc);
                bounds.extend(App.Data.userPos);
                map.fitBounds(bounds, 50); // Add 50px padding
            }

            mapDiv.style.display = 'block';
        } catch (e) {
            console.error("Map Enhancement Error (v2.3):", e);
            mapDiv.style.display = 'none';
        }
    } else {
        mapDiv.style.display = 'none';
    }

    // Phone
    const phoneEl = getEl('res-phone');
    if (place.phone) {
        phoneEl.textContent = place.phone;
        phoneEl.href = `tel:${place.phone.replace(/\s+/g, '')}`;
        phoneEl.style.display = 'block';
    } else {
        phoneEl.style.display = 'none';
    }

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    const btn = getEl('open-maps-btn');
    btn.href = mapLink;

    if (place.durationText) {
        getEl('res-rating').textContent += `  •  🚶 ${place.durationText}`;
    }

    App.UI.showScreen('result-screen');
    App.UI.triggerConfetti();
}

async function restoreSession() {
    const resId = App.Data.params.get('resId');
    const lat = App.Data.params.get('lat');
    const lng = App.Data.params.get('lng');

    if (!resId) return;

    // Clean URL
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

        displayResult(restoredPlace);

        // Optional: Re-run search in background to populate lastFilteredResults for re-roll
        // findRestaurant(true); // Assuming we add a silent mode
    } catch (e) {
        console.error("Session restoration failed:", e);
        App.UI.showScreen('main-flow');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    getEl('find-btn').onclick = findRestaurant;
    getEl('retry-btn').onclick = reRoll;
    getEl('back-btn').onclick = () => App.UI.showScreen('main-flow');

    const slider = getEl('distance-slider');
    slider.value = App.Config.mins;
    slider.oninput = function () {
        const mins = parseInt(this.value);
        App.Config.mins = mins;
        getEl('distance-val').textContent = mins;
        App.saveSettings();
        App.UI.triggerHaptic(10);
    };

    App.init();
});
