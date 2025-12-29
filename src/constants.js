export const CUISINE_MAPPING = {
    chinese: ['chinese_restaurant', 'asian_restaurant', 'chinese', 'cantonese', 'shanghainese', 'sichuan', 'dim sum', 'congee', '中菜', '中式', '粵菜', '上海', '川菜', '京菜', '點心', '粥', '燒味'],
    japanese: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'japanese', 'sushi', 'ramen', 'izakaya', 'udon', 'soba', 'yakitori', 'tonkatsu', '日本', '壽司', '拉麵', '居酒屋', '烏冬', '蕎麥', '燒鳥', '丼', '天婦羅'],
    korean: ['korean_restaurant', 'korean', 'kimchi', 'bibimbap', 'bbq', '韓國', '韓式', '泡菜', '飯卷', '韓燒', '炸雞'],
    western: ['italian_restaurant', 'french_restaurant', 'american_restaurant', 'hamburger_restaurant', 'pizza_restaurant', 'steak_house', 'brazilian_restaurant', 'greek_restaurant', 'mediterranean_restaurant', 'mexican_restaurant', 'seafood_restaurant', 'spanish_restaurant', 'buffet_restaurant', 'fine_dining_restaurant', 'steak', 'italian', 'french', 'burger', 'pasta', 'pizza', 'western', 'mexican', 'spanish', '西餐', '意式', '法式', '漢堡', '薄餅', '牛扒', '扒房', '自助餐'],
    se_asian: ['thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant', 'thai', 'vietnamese', 'malaysian', 'singaporean', 'indonesian', '泰國', '越南', '星馬', '印尼', '泰式', '越式', '海南雞', '冬蔭功', '喇沙'],
    noodles: ['ramen_restaurant', 'noodle', 'ramen', 'udon', 'pho', '米線', '拉麵', '麵', '粉', '河', '雲吞'],
    spicy: ['spicy', 'sichuan', 'mala', 'chili', '川菜', '麻辣', '辣', '水煮', '酸辣', '湘菜'],
    hotpot_bbq: ['barbecue_restaurant', 'steak_house', 'hot pot', 'hotpot', 'bbq', 'barbecue', 'grill', 'yakiniku', '火鍋', '雞煲', '燒肉', '韓燒', '燒烤', '串燒', '打邊爐', '肉', '扒', 'bbq'],
    dim_sum: ['chinese_restaurant', 'dim sum', 'yum cha', 'dumpling', '點心', '飲茶', '餃子', '盅飯', '包點'],
    dessert: ['bakery', 'ice_cream_shop', 'dessert_restaurant', 'dessert_shop', 'confectionery', 'chocolate_factory', 'chocolate_shop', 'candy_store', 'donut_shop', 'dessert', 'sugar', 'sweet', 'bakery', 'cake', 'ice cream', '糖水', '甜', '雪糕', '冰', '蛋糕', '餅', '班戟'],
    fast_food: ['fast_food_restaurant', 'hamburger_restaurant', 'sandwich_shop', 'fast food', 'food_court', 'mcdonald', 'kfc', 'burger', 'sandwich', '快餐', '小食', '漢堡', '三文治', '炸雞', '熱狗'],
    cafe_light: ['cafe', 'coffee_shop', 'bakery', 'breakfast_restaurant', 'brunch_restaurant', 'cafeteria', 'diner', 'juice_shop', 'meal_delivery', 'meal_takeaway', 'tea_house', 'bagel_shop', 'acai_shop', 'cafe', 'coffee', 'sandwich', 'salad', 'breakfast', 'brunch', '輕食', '咖啡', '沙律', '早餐', '早午餐', '文青', '下午茶'],
    indian_middle_east: ['indian_restaurant', 'lebanese_restaurant', 'turkish_restaurant', 'middle_eastern_restaurant', 'afghani_restaurant', 'indian', 'curry', 'middle eastern', 'kebab', '印度', '咖哩', '中東', '土耳其'],
    healthy_vege: ['vegan_restaurant', 'vegetarian_restaurant', 'acai_shop', 'juice_shop', 'vegan', 'vegetarian', 'healthy', 'organic', 'salad', '素食', '健康', '沙律', '有機'],
    sushi_sashimi: ['sushi_restaurant', 'japanese_restaurant', 'sushi', 'sashimi', '壽司', '刺身', '日本', 'omakase'],
    burger_pizza: ['hamburger_restaurant', 'pizza_restaurant', 'burger', 'pizza', '漢堡', '薄餅', '漢堡包', '意粉'],
    rice_bento: ['restaurant', 'bento', 'rice', 'donburi', '飯', '定食', '便當', '丼', '盅飯', '煲仔飯']
};

export const GOOGLE_PLACE_TYPES = [
    "asian_restaurant", "chinese_restaurant", "indian_restaurant",
    "indonesian_restaurant", "japanese_restaurant", "korean_restaurant",
    "ramen_restaurant", "sushi_restaurant", "thai_restaurant",
    "vietnamese_restaurant", "lebanese_restaurant", "turkish_restaurant",
    "middle_eastern_restaurant", "afghani_restaurant", "african_restaurant",
    "american_restaurant", "barbecue_restaurant", "brazilian_restaurant",
    "french_restaurant", "greek_restaurant", "italian_restaurant",
    "mediterranean_restaurant", "mexican_restaurant", "pizza_restaurant",
    "seafood_restaurant", "spanish_restaurant", "steak_house",
    "buffet_restaurant", "fine_dining_restaurant", "restaurant",
    "bar_and_grill", "vegan_restaurant", "vegetarian_restaurant",
    "bakery", "breakfast_restaurant", "brunch_restaurant", "cafe",
    "cafeteria", "coffee_shop", "dessert_restaurant", "dessert_shop",
    "diner", "donut_shop", "fast_food_restaurant", "food_court",
    "hamburger_restaurant", "ice_cream_shop", "juice_shop",
    "meal_delivery", "meal_takeaway", "sandwich_shop", "tea_house",
    "bagel_shop", "acai_shop", "confectionery", "chocolate_factory",
    "chocolate_shop", "candy_store"
];

export const BASIC_PLACE_FIELDS = [
    "id", "displayName", "location", "rating", "userRatingCount",
    "regularOpeningHours", "priceLevel", "businessStatus", "types",
    "utcOffsetMinutes"
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
