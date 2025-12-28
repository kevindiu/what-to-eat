export const CUISINE_MAPPING = {
    chinese: ['chinese_restaurant', 'asian_restaurant', 'chinese', 'cantonese', 'shanghainese', 'sichuan', 'dim sum', 'congee', '中菜', '中式', '粵菜', '點心', '粥'],
    japanese: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'japanese', 'sushi', 'ramen', 'izakaya', 'udon', 'soba', 'yakitori', 'tonkatsu', '日本', '壽司', '拉麵', '居酒屋', '烏冬', '燒鳥'],
    korean: ['korean_restaurant', 'korean', 'kimchi', 'bibimbap', 'bbq', '韓國', '韓式', '泡菜', '飯卷', '韓燒'],
    western: ['italian_restaurant', 'french_restaurant', 'american_restaurant', 'hamburger_restaurant', 'pizza_restaurant', 'steak_house', 'brazilian_restaurant', 'greek_restaurant', 'mediterranean_restaurant', 'mexican_restaurant', 'seafood_restaurant', 'spanish_restaurant', 'buffet_restaurant', 'fine_dining_restaurant', 'restaurant', 'bar_and_grill', 'vegan_restaurant', 'vegetarian_restaurant', 'lebanese_restaurant', 'turkish_restaurant', 'middle_eastern_restaurant', 'afghani_restaurant', 'african_restaurant', 'steak', 'italian', 'french', 'burger', 'pasta', 'pizza', 'western', 'mexican', 'spanish', '西餐', '意式', '法式', '漢堡', '薄餅', '牛扒'],
    se_asian: ['thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant', 'thai', 'vietnamese', 'malaysian', 'singaporean', 'indonesian', '泰國', '越南', '星馬', '印尼', '泰式', '越式'],
    noodles: ['ramen_restaurant', 'noodle', 'ramen', 'udon', 'pho', '米線', '拉麵', '麵', '粉', '河'],
    spicy: ['spicy', 'sichuan', 'mala', 'chili', 'indian_restaurant', '川菜', '麻辣', '辣', '水煮', '酸辣'],
    hotpot_bbq: ['barbecue_restaurant', 'steak_house', 'hot pot', 'hotpot', 'bbq', 'barbecue', 'grill', 'yakiniku', '火鍋', '雞煲', '燒肉', '韓燒', '燒烤', '串燒'],
    dim_sum: ['chinese_restaurant', 'dim sum', 'yum cha', 'dumpling', '點心', '飲茶', '餃子', '盅飯'],
    dessert: ['bakery', 'ice_cream_shop', 'dessert_restaurant', 'dessert_shop', 'confectionery', 'chocolate_factory', 'chocolate_shop', 'candy_store', 'donut_shop', 'dessert', 'sugar', 'sweet', 'bakery', 'cake', 'ice cream', '糖水', '甜', '雪糕', '冰', '蛋糕', '餅'],
    fast_food: ['fast_food_restaurant', 'hamburger_restaurant', 'sandwich_shop', 'fast food', 'food_court', 'mcdonald', 'kfc', 'burger', 'sandwich', '快餐', '小食', '漢堡', '三文治'],
    cafe_light: ['cafe', 'coffee_shop', 'bakery', 'breakfast_restaurant', 'brunch_restaurant', 'cafeteria', 'diner', 'juice_shop', 'meal_delivery', 'meal_takeaway', 'tea_house', 'bagel_shop', 'acai_shop', 'cafe', 'coffee', 'sandwich', 'salad', 'breakfast', 'brunch', '輕食', '咖啡', '沙律', '早餐', '早午餐', '文青']
};

// Basic fields for discovery (Low cost or free SKUs)
export const BASIC_PLACE_FIELDS = [
    "id", "displayName", "location", "rating", "userRatingCount",
    "regularOpeningHours", "priceLevel", "businessStatus", "types"
];

// Detailed fields for the winner (Expensive SKUs like photos and reviews)
export const DETAIL_PLACE_FIELDS = [
    "id", "formattedAddress", "regularOpeningHours", "nationalPhoneNumber",
    "photos", "reviews", "googleMapsURI"
];

export const PRICE_LEVEL_MAP = {
    'PRICE_LEVEL_FREE': { val: '0', label: (t) => t.priceFree },
    'PRICE_LEVEL_INEXPENSIVE': { val: '1', label: () => '$' },
    'PRICE_LEVEL_MODERATE': { val: '2', label: () => '$$' },
    'PRICE_LEVEL_EXPENSIVE': { val: '3', label: () => '$$$' },
    'PRICE_LEVEL_VERY_EXPENSIVE': { val: '4', label: () => '$$$$' }
};

// Backwards compatibility and numeric mapping
export const PRICE_VAL_TO_KEY = {
    '0': 'PRICE_LEVEL_FREE',
    '1': 'PRICE_LEVEL_INEXPENSIVE',
    '2': 'PRICE_LEVEL_MODERATE',
    '3': 'PRICE_LEVEL_EXPENSIVE',
    '4': 'PRICE_LEVEL_VERY_EXPENSIVE'
};

export const CONSTANTS = {
    DEFAULT_SEARCH_RADIUS_MULTIPLIER: 80,
    DEFAULT_MINS: 5,
    HAPTIC_FEEDBACK_DURATION: {
        SHORT: 30,
        MEDIUM: 50,
        LONG: 100
    },
    ANIMATION_INTERVAL: 100,
    METERS_PER_DEGREE_LAT: 111320
};
