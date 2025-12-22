const translations = {
    zh: {
        title: "食乜好？",
        subtitle: "唔知食咩？我幫你揀！",
        filterTitle: "今日唔想食咩類型？",
        findBtn: "幫我揀間餐廳！",
        openMaps: "喺 Google Maps 打開",
        retry: "再揀過",
        loading: "搜尋緊附近好嘢食...",
        noResults: "附近搵唔到開門嘅餐廳，試下行遠啲？",
        geoError: "拎唔到你個位，請檢查下權限。",
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
        filterTitle: "What do you NOT want to eat?",
        findBtn: "Pick for me! ✨",
        openMaps: "Open in Google Maps 🗺️",
        retry: "Try Again 🔄",
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
        filterTitle: "今は食べたくないものは？",
        findBtn: "選んで！ ✨",
        openMaps: "Googleマップで開く 🗺️",
        retry: "もう一度 🔄",
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
let service;

// Initial setup functions


// Make setLanguage global
window.setLanguage = function (lang) {
    currentLang = lang;
    updateUIStrings();
    initFilters();
};


function updateUIStrings() {
    const t = translations[currentLang];
    document.getElementById('app-title').textContent = t.title;
    document.getElementById('app-subtitle').textContent = t.subtitle;
    document.getElementById('filter-title').textContent = t.filterTitle;
    document.getElementById('find-btn').textContent = t.findBtn;
    document.getElementById('retry-btn').textContent = t.retry;
    document.getElementById('loading-text').textContent = t.loading;
    if (document.getElementById('open-maps-btn')) {
        document.getElementById('open-maps-btn').textContent = t.openMaps;
    }
}

function initFilters() {
    const list = getEl('filter-list');
    if (!list) return;
    list.innerHTML = '';
    const cats = translations[currentLang].categories;
    Object.keys(cats).forEach(id => {
        const label = cats[id];
        const div = document.createElement('div');
        div.className = 'filter-item' + (excludedTypes.has(id) ? ' active' : '');
        div.textContent = label;
        div.onclick = () => {
            div.classList.toggle('active');
            if (excludedTypes.has(id)) {
                excludedTypes.delete(id);
            } else {
                excludedTypes.add(id);
            }
        };
        list.appendChild(div);
    });
}


const getEl = id => document.getElementById(id);

function showScreen(screenId) {
    ['main-flow', 'result-screen', 'loading-screen'].forEach(id => {
        const el = getEl(id);
        if (el) el.classList.add('hidden');
    });
    const target = getEl(screenId);
    if (target) target.classList.remove('hidden');
}


async function findRestaurant() {
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
            // New pattern: import libraries dynamically
            const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");

            const request = {
                // Required fields for the new Places API
                fields: ["displayName", "location", "rating", "formattedAddress", "id", "types"],
                locationRestriction: {
                    center: userLoc,
                    radius: 1000,
                },
                includedPrimaryTypes: ["restaurant"],
                maxResultCount: 20,
            };

            const { places } = await Place.searchNearby(request);

            if (places && places.length > 0) {
                // Map the new Place objects to our expected format
                const results = places.map(p => ({
                    name: p.displayName,
                    rating: p.rating,
                    vicinity: p.formattedAddress,
                    place_id: p.id,
                    types: p.types || []
                }));

                let filtered = results;
                if (excludedTypes.size > 0) {
                    filtered = results.filter(place => {
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
                }

                if (filtered.length === 0) {
                    alert(t.noResults);
                    showScreen('main-flow');
                    return;
                }

                const randomPlace = filtered[Math.floor(Math.random() * filtered.length)];
                displayResult(randomPlace);
            } else {
                alert(t.noResults);
                showScreen('main-flow');
            }
        } catch (error) {
            console.error("Google Places Error:", error);
            alert("Google Maps API failed to search. Please check your API key and billing status.");
            showScreen('main-flow');
        }
    }, (error) => {
        console.error("Geo Error:", error);
        alert(t.geoError);
        showScreen('main-flow');
    }, geoOptions);
}


function displayResult(place) {
    document.getElementById('res-name').textContent = place.name;
    document.getElementById('res-rating').textContent = place.rating ? `⭐ ${place.rating}` : "⭐ New!";
    document.getElementById('res-address').textContent = place.vicinity;

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    const btn = document.getElementById('open-maps-btn');
    btn.href = mapLink;
    btn.textContent = translations[currentLang].openMaps;

    showScreen('result-screen');
}


// Event Listeners & Initialization
document.addEventListener('DOMContentLoaded', () => {
    const findBtn = getEl('find-btn');
    const retryBtn = getEl('retry-btn');

    if (findBtn) findBtn.onclick = findRestaurant;
    if (retryBtn) retryBtn.onclick = () => showScreen('main-flow');

    updateUIStrings();
    initFilters();
});

