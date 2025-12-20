const restaurantTypes = [
    { id: 'chinese', label: '中餐' },
    { id: 'japanese', label: '日本菜' },
    { id: 'korean', label: '韓國菜' },
    { id: 'western', label: '西餐' },
    { id: 'thai', label: '泰國菜' },
    { id: 'cafe', label: 'Cafe' },
    { id: 'fast_food', label: '快餐' },
    { id: 'dessert', label: '甜品' },
    { id: 'bbq', label: '燒肉' }
];

let excludedTypes = new Set();
let map, service;

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const resultScreen = document.getElementById('result-screen');
const loadingScreen = document.getElementById('loading-screen');
const filterOverlay = document.getElementById('filter-overlay');
const filterList = document.getElementById('filter-list');

// Init Filters
function initFilters() {
    restaurantTypes.forEach(type => {
        const div = document.createElement('div');
        div.className = 'filter-item';
        div.textContent = type.label;
        div.onclick = () => {
            div.classList.toggle('active');
            if (excludedTypes.has(type.label)) {
                excludedTypes.delete(type.label);
            } else {
                excludedTypes.add(type.label);
            }
        };
        filterList.appendChild(div);
    });
}

// Show/Hide screens
function showScreen(screenId) {
    [welcomeScreen, resultScreen, loadingScreen].forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// Logic to find restaurant
async function findRestaurant() {
    showScreen('loading-screen');

    // MOCK DATA for Demo Mode if Google is not available
    if (typeof google === 'undefined') {
        setTimeout(() => {
            const mockPlace = {
                name: "誠實豆沙包 (Demo)",
                rating: 4.5,
                vicinity: "香港中環某條街 (Demo Mode)",
                place_id: "demo_id"
            };
            displayResult(mockPlace);
        }, 1500);
        return;
    }

    if (!navigator.geolocation) {

        alert("你個瀏覽器唔支援取用地理位置呀。");
        showScreen('welcome-screen');
        return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
        const userLoc = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        // Setup hidden map for Places Service
        if (!service) {
            const mapContainer = document.createElement('div');
            service = new google.maps.places.PlacesService(mapContainer);
        }

        const request = {
            location: userLoc,
            radius: '1000', // 1km
            type: ['restaurant']
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                // Filter results by excluded types
                let filtered = results;
                if (excludedTypes.size > 0) {
                    filtered = results.filter(place => {
                        // Map our friendly labels back to keywords or check types
                        // Since Google types are generic, we check if ANY matching keyword exists
                        const placeTypes = place.types || [];
                        const isExcluded = Array.from(excludedTypes).some(label => {
                            const typeObj = restaurantTypes.find(t => t.label === label);
                            // Mapping logical types to Google Places types or keywords
                            const mapping = {
                                '中餐': ['chinese_restaurant', 'chinese'],
                                '日本菜': ['japanese_restaurant', 'sushi', 'japanese'],
                                '韓國菜': ['korean_restaurant', 'korean'],
                                '西餐': ['western_restaurant', 'steakhouse', 'italian_restaurant', 'french_restaurant'],
                                '泰國菜': ['thai_restaurant', 'thai'],
                                'Cafe': ['cafe', 'coffee_shop'],
                                '快餐': ['fast_food', 'hamburger'],
                                '甜品': ['dessert', 'bakery', 'cake_shop'],
                                '燒肉': ['bbq', 'barbecue_restaurant']
                            };
                            const keywords = mapping[label] || [];
                            return keywords.some(kw => placeTypes.includes(kw) || place.name.toLowerCase().includes(kw));
                        });
                        return !isExcluded;
                    });
                }

                if (filtered.length === 0) {
                    alert("衰咗！過濾完之後附近無晒餐廳。試下揀少啲「唔想食」嘅野？");
                    showScreen('welcome-screen');
                    return;
                }

                const randomPlace = filtered[Math.floor(Math.random() * filtered.length)];
                displayResult(randomPlace);
            } else {
                alert("附近搵唔到餐廳，試下行遠啲？");
                showScreen('welcome-screen');
            }
        });

    }, (error) => {
        alert("拎唔到你個位，請檢查下權限。");
        showScreen('welcome-screen');
    });
}

function displayResult(place) {
    document.getElementById('res-name').textContent = place.name;
    document.getElementById('res-rating').textContent = `⭐ ${place.rating || 'N/A'}`;
    document.getElementById('res-address').textContent = place.vicinity;

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`;
    document.getElementById('res-link').href = mapLink;

    showScreen('result-screen');
}

// Event Listeners
document.getElementById('find-btn').onclick = findRestaurant;
document.getElementById('retry-btn').onclick = findRestaurant;
document.getElementById('filter-toggle').onclick = () => filterOverlay.classList.remove('hidden');
document.getElementById('close-filter').onclick = () => filterOverlay.classList.add('hidden');

// Start
initFilters();
