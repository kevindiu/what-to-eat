export const CATEGORY_DEFINITIONS = {
    chinese: {
        googleTypes: ['chinese_restaurant', 'cantonese_restaurant', 'shanghainese_restaurant'],
        searchTypes: ['chinese_restaurant'],
        zh_keywords: ['中菜', '中式', '粵菜', '上海', '川菜', '京菜', '燒味', '大牌檔', '粥', '潮州', '客家', '小菜', '中菜館', '私房菜', '滬菜', '浙菜', '順德菜'],
        en_keywords: ['chinese', 'cantonese', 'sichuan', 'shanghainese', 'chiu chow', 'congee', 'hakka', 'bistro', 'dapai', 'shunde'],
        jp_keywords: ['中華料理', '中国料理'],
        negativeKeywords: ['點心'],
        isBroad: true
    },
    japanese: {
        googleTypes: ['japanese_restaurant'],
        searchTypes: ['japanese_restaurant'],
        zh_keywords: ['日本', '居酒屋', '烏冬', '蕎麥', '燒鳥', '丼', '天婦羅', '鐵板燒', '爐端燒', '和牛', '懷石料理'],
        en_keywords: ['japanese', 'udon', 'soba', 'yakitori', 'tempura', 'donburi', 'izakaya', 'teppanyaki', 'wagyu', 'kaiseki', 'kappo'],
        jp_keywords: ['日本料理', '和食', 'うどん', 'そば', '天ぷら', '丼物', '懐石', '割烹', '焼き鳥', 'とんかつ', '鉄板焼き', '和牛'],
        isBroad: true
    },
    sushi_sashimi: {
        googleTypes: ['sushi_restaurant'],
        searchTypes: ['sushi_restaurant', 'japanese_restaurant'],
        zh_keywords: ['壽司', '刺身', '鮨', '丼'],
        en_keywords: ['sushi', 'sashimi', 'omakase', 'skewer'],
        jp_keywords: ['寿司', '鮨', '刺身'],
        isBroad: false
    },
    korean: {
        googleTypes: ['korean_restaurant'],
        searchTypes: ['korean_restaurant'],
        zh_keywords: ['韓國', '韓式', '泡菜', '飯卷', '韓燒', '炸雞', '部隊鍋', '石鍋拌飯', '炸醬麵'],
        en_keywords: ['korean', 'kimchi', 'bbq', 'fried chicken', 'gimbap', 'bibimbap', 'jajangmyeon', 'k-food'],
        jp_keywords: ['韓国料理', 'ビビンバ', 'キムチ', '焼肉'],
        isBroad: true
    },
    western: {
        googleTypes: ['french_restaurant', 'american_restaurant', 'steak_house', 'mediterranean_restaurant', 'mexican_restaurant', 'spanish_restaurant', 'greek_restaurant', 'brazilian_restaurant', 'african_restaurant'],
        searchTypes: ['french_restaurant', 'american_restaurant', 'steak_house'],
        zh_keywords: ['西餐', '法式', '漢堡', '牛扒', '扒房', '義大利', '地中海', '墨西哥', '西班牙'],
        en_keywords: ['western', 'french', 'steak', 'mexican', 'spanish', 'mediterranean', 'bistro', 'gastropub', 'tapas'],
        jp_keywords: ['洋食', 'フレンチ', 'ステーキ', 'ハンバーガー'],
        isBroad: true
    },
    burger_pizza: {
        googleTypes: ['hamburger_restaurant', 'pizza_restaurant', 'sandwich_shop'],
        searchTypes: ['hamburger_restaurant', 'pizza_restaurant'],
        zh_keywords: ['漢堡', '薄餅', '披薩', '三文治'],
        en_keywords: ['burger', 'pizza', 'sandwich', 'burger joint'],
        jp_keywords: ['ハンバーガー', 'ピザ'],
        isBroad: false
    },
    se_asian: {
        googleTypes: ['thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant'],
        searchTypes: ['thai_restaurant', 'vietnamese_restaurant', 'indonesian_restaurant'],
        zh_keywords: ['泰國', '越南', '星馬', '印尼', '泰式', '越式', '海南雞', '冬蔭功', '喇沙', '肉骨茶', '沙爹', '馬來西亞', '新加坡'],
        en_keywords: ['thai', 'vietnamese', 'malaysian', 'singaporean', 'indonesian', 'pho', 'curry', 'laksa', 'satay', 'hainanese chicken'],
        jp_keywords: ['タイ料理', 'ベトナム料理'],
        isBroad: true
    },
    noodles: {
        googleTypes: ['ramen_restaurant'],
        searchTypes: ['ramen_restaurant', 'chinese_restaurant', 'restaurant'],
        zh_keywords: ['米線', '拉麵', '麵', '粉', '河', '雲吞', '牛腩', '水餃', '車仔麵', '墨魚丸', '過橋', '擔擔', '腩汁'],
        en_keywords: ['noodle', 'ramen', 'pho', 'udon', 'vermicelli', 'beef brisket', 'wonton', 'rice noodle', 'tan tan', 'crossing the bridge'],
        jp_keywords: ['麺', 'ラーメン', 'うどん', 'そば'],
        negativeKeywords: ['義大利麵', '意粉', 'pasta'],
        isBroad: false
    },
    rice_bento: {
        googleTypes: [],
        searchTypes: ['chinese_restaurant', 'japanese_restaurant', 'restaurant'],
        zh_keywords: ['飯', '定食', '便當', '盅飯', '碟頭飯', '焗飯'],
        en_keywords: ['rice', 'bento', 'set meal'],
        jp_keywords: ['ご飯', '定食', '弁当'],
        isBroad: false
    },
    spicy: {
        googleTypes: [],
        searchTypes: ['chinese_restaurant', 'asian_restaurant', 'restaurant'],
        zh_keywords: ['麻辣', '辣', '水煮', '酸辣', '湘菜', '川菜', '重慶', '辣味'],
        en_keywords: ['spicy', 'mala', 'chili', 'hot', 'sichuan', 'hunanese', 'chungking'],
        jp_keywords: ['四川料理', '辛い', '激辛'],
        isBroad: false
    },
    hotpot_bbq: {
        googleTypes: ['barbecue_restaurant'],
        searchTypes: ['barbecue_restaurant', 'chinese_restaurant', 'japanese_restaurant', 'korean_restaurant', 'restaurant'],
        zh_keywords: ['火鍋', '雞煲', '燒肉', '韓燒', '燒烤', '串燒', '打邊爐', '台式火鍋'],
        en_keywords: ['bbq', 'hot pot', 'hotpot', 'barbecue', 'grill', 'shabu shabu', 'yakiniku', 'steamboat'],
        jp_keywords: ['焼肉', '火鍋', 'ステーキ', 'しゃぶしゃぶ', 'すき焼き'],
        isBroad: false
    },
    dim_sum: {
        googleTypes: [],
        searchTypes: ['chinese_restaurant', 'restaurant'],
        zh_keywords: ['點心', '飲茶', '蝦餃', '盅飯', '小籠包', '燒賣', '酒樓', '茶樓'],
        en_keywords: ['yum cha', 'dim sum', 'dumpling', 'xiao long bao', 'teahouse'],
        jp_keywords: ['飲茶', '点心'],
        isBroad: false
    },
    fine_dining_buffet: {
        googleTypes: ['fine_dining_restaurant', 'buffet_restaurant', 'seafood_restaurant'],
        searchTypes: ['fine_dining_restaurant', 'buffet_restaurant', 'restaurant'],
        zh_keywords: ['高級', '自助餐', '海鮮', '蠔吧', '精緻餐飲'],
        en_keywords: ['fine dining', 'buffet', 'seafood', 'oyster bar', 'gastronomy'],
        jp_keywords: ['高級料理', 'ビュッフェ', 'シーフード'],
        isBroad: false
    },
    all_day_brunch: {
        googleTypes: ['breakfast_restaurant', 'brunch_restaurant', 'cafe', 'tea_house', 'coffee_shop', 'cat_cafe', 'dog_cafe'],
        searchTypes: ['breakfast_restaurant', 'brunch_restaurant', 'cafe', 'coffee_shop'],
        zh_keywords: ['brunch', 'breakfast', 'pancake', '全日早餐', '早午餐', '班戟', '舒芙蕾', '鬆餅', '咖啡', '文青'],
        en_keywords: ['coffee', 'cafe', 'tea', 'all day breakfast', 'specialty coffee', 'roaster'],
        jp_keywords: ['カフェ', '朝食', 'ブランチ'],
        isBroad: true
    },
    bar_izakaya: {
        googleTypes: ['bar', 'pub', 'wine_bar', 'bar_and_grill'],
        searchTypes: ['bar', 'pub'],
        zh_keywords: ['酒', '居酒屋', '酒吧', '串燒', '啤酒', '威士忌', '琴酒'],
        en_keywords: ['bar', 'pub', 'wine', 'beer', 'cocktail', 'izakaya', 'craft beer', 'whisky', 'gin', 'lounge'],
        jp_keywords: ['居酒屋', 'バー', 'ビール', 'ワイン'],
        isBroad: true
    },
    dessert: {
        googleTypes: ['bakery', 'ice_cream_shop', 'dessert_restaurant', 'dessert_shop', 'confectionery', 'chocolate_shop', 'donut_shop', 'juice_shop'],
        searchTypes: ['bakery', 'ice_cream_shop', 'dessert_restaurant', 'dessert_shop'],
        zh_keywords: ['糖水', '甜', '雪糕', '冰', '蛋糕', '餅', '班戟', '糖水舖', '甜品'],
        en_keywords: ['dessert', 'sweet', 'ice cream', 'cake', 'bakery', 'pancake', 'waffle', 'yogurt', 'bingsu', 'shaved ice'],
        jp_keywords: ['デザート', 'スイーツ', 'ケーキ', 'アイス', 'パンケーキ'],
        isBroad: true
    },
    fast_food: {
        googleTypes: ['fast_food_restaurant', 'hamburger_restaurant', 'deli', 'food_court', 'diner', 'meal_delivery', 'meal_takeaway'],
        searchTypes: ['fast_food_restaurant', 'restaurant'],
        zh_keywords: ['快餐', '小食', '炸雞', '熱狗', '外賣', '美食廣場'],
        en_keywords: ['fast food', 'snack', 'fried chicken', 'hotdog', 'takeaway', 'takeout', 'food court'],
        jp_keywords: ['ファストフード', 'フードコート'],
        isBroad: true
    },
    indian_middle_east: {
        googleTypes: ['indian_restaurant', 'lebanese_restaurant', 'turkish_restaurant', 'middle_eastern_restaurant', 'afghani_restaurant'],
        searchTypes: ['indian_restaurant', 'middle_eastern_restaurant'],
        zh_keywords: ['印度', '咖哩', '中東', '土耳其', '清真'],
        en_keywords: ['kebab', 'curry', 'indian', 'middle eastern', 'turkish', 'hummus', 'tandoori', 'halal'],
        jp_keywords: ['インド料理', 'カレー'],
        isBroad: true
    },
    healthy_vege: {
        googleTypes: ['vegan_restaurant', 'vegetarian_restaurant'],
        searchTypes: ['vegan_restaurant', 'vegetarian_restaurant', 'restaurant'],
        zh_keywords: ['素食', '健康', '沙律', '有機', '蔬食', '純素'],
        en_keywords: ['vegan', 'vegetarian', 'salad', 'healthy', 'organic', 'green', 'plant-based'],
        jp_keywords: ['ベジタリアン', 'サラダ'],
        isBroad: true
    }
};

export const BROAD_PLACE_TYPES = [
    'restaurant', 'point_of_interest', 'seafood_restaurant', 'buffet_restaurant', 'fine_dining_restaurant', 'food_court', 'diner', 'asian_restaurant'
];

export const ALWAYS_KEEP_SEARCH_TYPES = [
    'restaurant', 'diner'
];

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
    "bar_and_grill", "bar", "vegan_restaurant", "vegetarian_restaurant",
    "cat_cafe", "chinese_restaurant", "chocolate_factory", "chocolate_shop",
    "coffee_shop", "confectionery", "deli", "dessert_restaurant", "dessert_shop",
    "diner", "dog_cafe", "donut_shop", "fast_food_restaurant",
    "fine_dining_restaurant", "food_court", "french_restaurant",
    "greek_restaurant", "hamburger_restaurant", "ice_cream_shop",
    "indian_restaurant", "indonesian_restaurant", "italian_restaurant",
    "japanese_restaurant", "juice_shop", "korean_restaurant",
    "lebanese_restaurant", "meal_delivery", "meal_takeaway",
    "mediterranean_restaurant", "mexican_restaurant",
    "middle_eastern_restaurant", "pizza_restaurant", "pub", "ramen_restaurant",
    "restaurant", "sandwich_shop", "seafood_restaurant", "spanish_restaurant",
    "steak_house", "sushi_restaurant", "tea_house", "thai_restaurant",
    "turkish_restaurant", "vegan_restaurant", "vegetarian_restaurant",
    "vietnamese_restaurant", "wine_bar"
];

export const BASIC_PLACE_FIELDS = [
    "id", "displayName", "location", "rating", "userRatingCount",
    "regularOpeningHours", "priceLevel", "businessStatus", "types",
    "utcOffsetMinutes"
];

// Detailed fields for the winner (Expensive SKUs like photos and reviews)
export const DETAIL_PLACE_FIELDS = [
    "id", "formattedAddress", "regularOpeningHours", "nationalPhoneNumber",
    "photos", "reviews", "googleMapsURI", "googleMapsLinks"
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
