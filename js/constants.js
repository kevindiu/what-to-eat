export const CUISINE_MAPPING = {
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

export const PLACE_FIELDS = [
    "displayName", "location", "rating", "userRatingCount",
    "formattedAddress", "id", "types", "regularOpeningHours",
    "priceLevel", "nationalPhoneNumber", "businessStatus"
];

export const PRICE_LEVEL_MAP = {
    'PRICE_LEVEL_FREE': '0',
    'PRICE_LEVEL_INEXPENSIVE': '1',
    'PRICE_LEVEL_MODERATE': '2',
    'PRICE_LEVEL_EXPENSIVE': '3',
    'PRICE_LEVEL_VERY_EXPENSIVE': '4'
};
