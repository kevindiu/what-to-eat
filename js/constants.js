export const CUISINE_MAPPING = {
    chinese: ['chinese_restaurant', 'chinese', 'cantonese', 'shanghainese', 'sichuan', 'dim sum', 'congee', '中菜', '中式', '粵菜', '點心', '粥'],
    japanese: ['japanese_restaurant', 'sushi_restaurant', 'ramen_restaurant', 'japanese', 'sushi', 'ramen', 'izakaya', 'udon', 'soba', 'yakitori', 'tonkatsu', '日本', '壽司', '拉麵', '居酒屋', '烏冬', '燒鳥'],
    korean: ['korean_restaurant', 'korean', 'kimchi', 'bibimbap', 'bbq', '韓國', '韓式', '泡菜', '飯卷', '韓燒'],
    western: ['italian_restaurant', 'french_restaurant', 'american_restaurant', 'hamburger_restaurant', 'pizza_restaurant', 'steak_house', 'steak', 'italian', 'french', 'burger', 'pasta', 'pizza', 'western', 'mexican', 'spanish', '西餐', '意式', '法式', '漢堡', '薄餅', '牛扒'],
    se_asian: ['thai_restaurant', 'vietnamese_restaurant', 'thai', 'vietnamese', 'malaysian', 'singaporean', 'indonesian', '泰國', '越南', '星馬', '印尼', '泰式', '越式'],
    noodles: ['ramen_restaurant', 'noodle', 'ramen', 'udon', 'pho', '米線', '拉麵', '麵', '粉', '河'],
    spicy: ['spicy', 'sichuan', 'mala', 'chili', '川菜', '麻辣', '辣', '水煮', '酸辣'],
    hotpot_bbq: ['barbecue_restaurant', 'steak_house', 'hot pot', 'hotpot', 'bbq', 'barbecue', 'grill', 'yakiniku', '火鍋', '雞煲', '燒肉', '韓燒', '燒烤', '串燒'],
    dim_sum: ['chinese_restaurant', 'dim sum', 'yum cha', 'dumpling', '點心', '飲茶', '餃子', '盅飯'],
    dessert: ['bakery', 'ice_cream_shop', 'dessert', 'sugar', 'sweet', 'bakery', 'cake', 'ice cream', '糖水', '甜', '雪糕', '冰', '蛋糕', '餅'],
    fast_food: ['fast_food_restaurant', 'hamburger_restaurant', 'sandwich_shop', 'fast food', 'mcdonald', 'kfc', 'burger', 'sandwich', '快餐', '小食', '漢堡', '三文治'],
    cafe_light: ['cafe', 'coffee_shop', 'bakery', 'cafe', 'coffee', 'sandwich', 'salad', 'breakfast', 'brunch', '輕食', '咖啡', '沙律', '早餐', '早午餐', '文青']
};

export const PLACE_FIELDS = [
    "displayName", "location", "rating", "userRatingCount",
    "formattedAddress", "id", "types", "regularOpeningHours",
    "priceLevel", "nationalPhoneNumber", "businessStatus"
];

export const PRICE_LEVEL_MAP = {
    'PRICE_LEVEL_FREE': '0', '0': '0',
    'PRICE_LEVEL_INEXPENSIVE': '1', '1': '1',
    'PRICE_LEVEL_MODERATE': '2', '2': '2',
    'PRICE_LEVEL_EXPENSIVE': '3', '3': '3',
    'PRICE_LEVEL_VERY_EXPENSIVE': '4', '4': '4'
};
