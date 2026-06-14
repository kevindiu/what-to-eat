export const CATEGORY_DEFINITIONS = {
    pet_cafe: {
        types: ['cat_cafe', 'dog_cafe']
    },
    ramen: {
        types: ['ramen_restaurant']
    },
    sushi: {
        types: ['sushi_restaurant']
    },
    steak_house: {
        types: ['steak_house']
    },
    bbq_grill: {
        types: ['barbecue_restaurant']
    },
    seafood: {
        types: ['seafood_restaurant']
    },
    dessert_bakery: {
        types: ['bakery', 'dessert_restaurant', 'dessert_shop', 'ice_cream_shop', 'confectionery', 'chocolate_shop', 'chocolate_factory', 'donut_shop', 'candy_store']
    },
    burgers_pizza: {
        types: ['hamburger_restaurant', 'pizza_restaurant', 'sandwich_shop']
    },
    korean: {
        types: ['korean_restaurant']
    },
    se_asian: {
        types: ['thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant']
    },
    mexican: {
        types: ['mexican_restaurant']
    },
    indian_mid_east: {
        types: ['indian_restaurant', 'middle_eastern_restaurant', 'turkish_restaurant', 'lebanese_restaurant', 'afghani_restaurant']
    },
    buffet_fine: {
        types: ['buffet_restaurant', 'fine_dining_restaurant']
    },
    chinese: {
        types: ['chinese_restaurant']
    },
    japanese: {
        types: ['japanese_restaurant']
    },
    western: {
        types: ['american_restaurant', 'french_restaurant', 'italian_restaurant', 'spanish_restaurant', 'greek_restaurant', 'brazilian_restaurant', 'mediterranean_restaurant']
    },
    healthy_vege: {
        types: ['vegan_restaurant', 'vegetarian_restaurant']
    },
    cafe_brunch: {
        types: ['cafe', 'coffee_shop', 'breakfast_restaurant', 'brunch_restaurant', 'tea_house', 'bagel_shop', 'acai_shop']
    },
    fast_food_court: {
        types: ['fast_food_restaurant', 'food_court', 'cafeteria', 'deli', 'meal_delivery', 'meal_takeaway']
    },
    bar_pub: {
        types: ['bar', 'pub', 'wine_bar', 'bar_and_grill']
    },
    others: {
        types: ['african_restaurant', 'asian_restaurant', 'restaurant', 'juice_shop']
    }
};

export const GOOGLE_PLACE_TYPES = [
    "chinese_restaurant", "japanese_restaurant", "ramen_restaurant", "sushi_restaurant",
    "korean_restaurant", "american_restaurant", "french_restaurant", "italian_restaurant",
    "mexican_restaurant", "spanish_restaurant", "steak_house", "mediterranean_restaurant",
    "greek_restaurant", "thai_restaurant", "vietnamese_restaurant", "indonesian_restaurant",
    "cafe", "coffee_shop", "breakfast_restaurant", "brunch_restaurant", "tea_house",
    "fast_food_restaurant", "hamburger_restaurant", "pizza_restaurant", "sandwich_shop",
    "bakery", "dessert_restaurant", "dessert_shop", "ice_cream_shop", "bar", "pub",
    "wine_bar", "bar_and_grill", "indian_restaurant", "middle_eastern_restaurant",
    "turkish_restaurant", "lebanese_restaurant", "vegan_restaurant", "vegetarian_restaurant",
    "buffet_restaurant", "fine_dining_restaurant", "seafood_restaurant", "barbecue_restaurant",
    "acai_shop", "bagel_shop", "cafeteria", "candy_store", "cat_cafe", "chocolate_factory",
    "chocolate_shop", "confectionery", "deli", "dog_cafe", "donut_shop", "juice_shop",
    "meal_delivery", "meal_takeaway", "afghani_restaurant", "african_restaurant",
    "asian_restaurant", "brazilian_restaurant", "restaurant", "diner"
];

export const BASIC_PLACE_FIELDS = [
    "id", "displayName", "location", "rating", "userRatingCount",
    "regularOpeningHours", "priceLevel", "businessStatus", "types",
    "formattedAddress", "photos"
];

export const DETAIL_PLACE_FIELDS = [
    "reviews", "editorialSummary", "regularOpeningHours",
    "googleMapsLinks", "googleMapsURI",
    "nationalPhoneNumber"
];

export const PRICE_LEVEL_MAP = {
    'PRICE_LEVEL_INEXPENSIVE': { val: '1', label: '$' },
    'PRICE_LEVEL_MODERATE': { val: '2', label: '$$' },
    'PRICE_LEVEL_EXPENSIVE': { val: '3', label: '$$$' },
    'PRICE_LEVEL_VERY_EXPENSIVE': { val: '4', label: '$$$$' }
};

export const PRICE_VAL_TO_KEY = {
    1: 'PRICE_LEVEL_INEXPENSIVE',
    2: 'PRICE_LEVEL_MODERATE',
    3: 'PRICE_LEVEL_EXPENSIVE',
    4: 'PRICE_LEVEL_VERY_EXPENSIVE'
};

export const CONSTANTS = {
    SEARCH_RADIUS: 1000,
    DEFAULT_MINS: 5,
    GOOGLE_MAPS_API_LIMIT: 20,
    GRID_RADIUS_STEP: 500,
    CANDIDATE_LIMIT: 60,
    SEARCH_CANDIDATE_LIMIT: 60,
    HISTORY_LIMIT: 20,
    METERS_PER_DEGREE_LAT: 111320,
    DEFAULT_SEARCH_RADIUS_MULTIPLIER: 80,
    HAPTIC_FEEDBACK_DURATION: {
        SHORT: 30,
        MEDIUM: 50,
        LONG: 100
    }
};
