console.log("食乜好 App v2.2 - Dynamic Maps Enabled");
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
        categories: {
            chinese: '🍚 中餐',
            japanese: '🍣 日本菜',
            korean: '🇰🇷 韓國菜',
            western: '🍕 西餐',
            thai: '🇹🇭 泰國菜',
            cafe: '☕ Cafe',
            fast_food: '🍔 快餐',
            dessert: '🍰 甜品',
            bbq: '🔥 燒肉'
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
        categories: {
            chinese: '🍚 Chinese',
            japanese: '🍣 Japanese',
            korean: '🇰🇷 Korean',
            western: '🍕 Western',
            thai: '🇹🇭 Thai',
            cafe: '☕ Cafe',
            fast_food: '🍔 Fast Food',
            dessert: '🍰 Dessert',
            bbq: '🔥 BBQ'
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
        categories: {
            chinese: '🍚 中華料理',
            japanese: '🍣 日本料理',
            korean: '🇰🇷 韓国料理',
            western: '🍕 洋食',
            thai: '🇹🇭 タイ料理',
            cafe: '☕ カフェ',
            fast_food: '🍔 ファストフード',
            dessert: '🍰 デザート',
            bbq: '🔥 焼肉'
        }
    }
};

let currentLang = 'zh';
const excludedTypes = new Set();
let currentRadius = 400; // Default 5 mins (80m/min)
let lastFilteredResults = [];
const selectedPrices = new Set(['1', '2', '3', '4']); // Default all selected

// Helper to get elements
const getEl = id => document.getElementById(id);

// Initialization: Auto-language detection with persistence
function detectLanguage() {
    const saved = localStorage.getItem('preferredLang');
    if (saved) return saved;

    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('ja')) return 'ja';
    if (userLang.startsWith('zh')) return 'zh';
    return 'en';
}

currentLang = detectLanguage();

// Make setLanguage global and persist choice
window.setLanguage = function (lang) {
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    updateUIStrings();
    initFilters();
};

function updateUIStrings() {
    const t = translations[currentLang];
    getEl('app-title').textContent = t.title;
    getEl('app-subtitle').textContent = t.subtitle;
    getEl('distance-title').innerHTML = `${t.distanceTitle} (<span id="distance-val">${currentRadius / 80}</span> mins)`;
    getEl('price-title').textContent = t.priceTitle;
    getEl('filter-title').textContent = t.filterTitle;
    getEl('find-btn').textContent = t.findBtn;
    getEl('retry-btn').textContent = t.retry;
    getEl('back-btn').textContent = t.backBtn;
    getEl('loading-text').textContent = t.loading;
    if (getEl('open-maps-btn')) {
        getEl('open-maps-btn').textContent = t.openMaps;
    }

    // Update active state in selector
    document.querySelectorAll('.lang-selector span').forEach(span => {
        const spanLang = span.onclick.toString().match(/'(\w+)'/)[1];
        span.classList.toggle('active', spanLang === currentLang);
    });
}

function initFilters() {
    // Categories
    const list = getEl('filter-list');
    if (list) {
        list.innerHTML = '';
        const cats = translations[currentLang].categories;
        Object.keys(cats).forEach(id => {
            const div = document.createElement('div');
            div.className = 'filter-item' + (excludedTypes.has(id) ? ' active' : '');
            div.textContent = cats[id];
            div.onclick = () => {
                div.classList.toggle('active');
                if (excludedTypes.has(id)) excludedTypes.delete(id);
                else excludedTypes.add(id);
                triggerHaptic(30);
            };
            list.appendChild(div);
        });
    }

    // Prices
    document.querySelectorAll('.price-item').forEach(item => {
        const p = item.dataset.price;
        item.classList.toggle('active', selectedPrices.has(p));
        item.onclick = () => {
            item.classList.toggle('active');
            if (selectedPrices.has(p)) selectedPrices.delete(p);
            else selectedPrices.add(p);
            triggerHaptic(30);
        };
    });
}

function showScreen(screenId) {
    ['main-flow', 'result-screen', 'loading-screen'].forEach(id => {
        const el = getEl(id);
        if (el) el.classList.add('hidden');
    });
    const target = getEl(screenId);
    if (target) target.classList.remove('hidden');
}

async function findRestaurant() {
    triggerHaptic(50);
    showScreen('loading-screen');
    const t = translations[currentLang];

    const geoOptions = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };

    if (!navigator.geolocation) {
        alert(t.noGeo);
        showScreen('main-flow');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };

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
                    radius: currentRadius,
                },
                includedPrimaryTypes: ["restaurant"],
                fields: ["displayName", "location", "rating", "userRatingCount", "formattedAddress", "id", "types", "regularOpeningHours", "priceLevel", "nationalPhoneNumber", "businessStatus"],
                maxResultCount: 20
            };

            const { places } = await Place.searchNearby(request);
            console.log("Found places:", places); // Debug log for user

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

                const filtered = results.filter(place => {
                    const placeTypes = place.types || [];
                    const name = (place.name || "").toLowerCase();

                    return !Array.from(excludedTypes).some(id => {
                        const mapping = {
                            chinese: ['chinese', 'dim sum', 'cantonese', '中', '粵', '點心'],
                            japanese: ['japanese', 'sushi', 'ramen', '日本', '壽司', '拉麵'],
                            korean: ['korean', '韓國'],
                            western: ['steak', 'italian', 'french', 'burger', 'pasta', 'western', '西', '意', '法', '漢堡'],
                            thai: ['thai', '泰'],
                            cafe: ['cafe', 'coffee', '咖啡'],
                            fast_food: ['fast food', 'mcdonald', 'kfc', '快餐'],
                            dessert: ['dessert', 'cake', 'bakery', '甜', '甜品', '蛋糕'],
                            bbq: ['bbq', 'barbecue', 'yakiniku', '燒', '燒肉']
                        };
                        const keywords = mapping[id] || [];
                        return keywords.some(kw => placeTypes.includes(kw.replace(' ', '_')) || name.includes(kw));
                    });
                });

                if (filtered.length === 0) {
                    alert(t.noResults);
                    showScreen('main-flow');
                    return;
                }

                // Filter by price level strictly
                const priceFiltered = filtered.filter(p => {
                    if (!p.priceLevel) return true; // Keep unknown price levels
                    const levelMap = {
                        'PRICE_LEVEL_INEXPENSIVE': '1',
                        'PRICE_LEVEL_MODERATE': '2',
                        'PRICE_LEVEL_EXPENSIVE': '3',
                        'PRICE_LEVEL_VERY_EXPENSIVE': '4'
                    };
                    const mapped = levelMap[p.priceLevel];
                    return selectedPrices.has(mapped);
                });

                if (priceFiltered.length === 0) {
                    alert(t.noResults + " (Try adjusting price filters)");
                    showScreen('main-flow');
                    return;
                }

                lastFilteredResults = priceFiltered;
                startSlotAnimation();
            } else {
                alert(t.noResults);
                showScreen('main-flow');
            }
        } catch (error) {
            console.error("Google Places Error:", error);
            alert("Google Maps API Error: Check billing/API restrictions.");
            showScreen('main-flow');
        }
    }, (error) => {
        console.error("Geo Error:", error);
        alert(t.geoError);
        showScreen('main-flow');
    }, geoOptions);
}

function triggerHaptic(duration) {
    if (navigator.vibrate) navigator.vibrate(duration || 30);
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff6b81', '#ffd32a', '#2ecc71', '#3498db']
        });
    }
}

function startSlotAnimation() {
    const slotName = getEl('slot-name');
    let count = 0;
    const interval = setInterval(() => {
        const temp = lastFilteredResults[Math.floor(Math.random() * lastFilteredResults.length)];
        slotName.textContent = temp.name;
        count++;
        if (count > 15) {
            clearInterval(interval);
            reRoll();
        }
    }, 100);
}

function reRoll() {
    triggerHaptic([50, 30, 50]);
    if (lastFilteredResults.length === 0) {
        findRestaurant();
        return;
    }
    const randomPlace = lastFilteredResults[Math.floor(Math.random() * lastFilteredResults.length)];
    displayResult(randomPlace);
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

    getEl('res-address').textContent = place.vicinity;

    // Map Preview (Dynamic Map)
    const mapDiv = getEl('res-map-container');
    const loc = place.location;

    if (loc) {
        try {
            const { Map } = await google.maps.importLibrary("maps");
            const map = new Map(mapDiv, {
                center: loc,
                zoom: 16,
                disableDefaultUI: true,
                gestureHandling: 'none'
            });

            new google.maps.Marker({
                position: loc,
                map: map,
                animation: google.maps.Animation.DROP
            });

            mapDiv.style.display = 'block';
        } catch (e) {
            console.error("Dynamic Map Error:", e);
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

    showScreen('result-screen');
    triggerConfetti();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    getEl('find-btn').onclick = findRestaurant;
    getEl('retry-btn').onclick = reRoll;
    getEl('back-btn').onclick = () => showScreen('main-flow');

    const slider = getEl('distance-slider');
    slider.oninput = function () {
        const mins = this.value;
        currentRadius = mins * 80;
        getEl('distance-val').textContent = mins;
        triggerHaptic(10);
    };

    updateUIStrings();
    initFilters();
});
