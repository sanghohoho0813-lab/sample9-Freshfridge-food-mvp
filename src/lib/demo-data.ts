import type {
  AppNotification,
  AppState,
  ConsumptionLog,
  Ingredient,
  IngredientCategory,
  Recipe,
  ShoppingItem,
  StorageType,
} from "./types";
import { addDays, toISODate, todayStart } from "./expiry-calculator";

let seq = 0;
function id(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface Seed {
  name: string;
  emoji: string;
  qty: number;
  unit: string;
  cat: IngredientCategory;
  storage: StorageType;
  boughtAgo: number; // n일 전 구매
  expiresIn: number | null; // n일 후 만료 (null = 정보 없음)
  price: number;
  memo?: string;
}

// 데모 스토리: 우유 D-1, 두부 D-1, 새송이버섯 D-2, 시금치 D-3 가 홈 상단에 뜨도록 구성
const INGREDIENT_SEEDS: Seed[] = [
  { name: "우유", emoji: "🥛", qty: 1, unit: "팩", cat: "dairy", storage: "fridge", boughtAgo: 6, expiresIn: 1, price: 3200 },
  { name: "두부", emoji: "🧈", qty: 1, unit: "모", cat: "processed", storage: "fridge", boughtAgo: 4, expiresIn: 1, price: 2400, memo: "찌개용 부침두부" },
  { name: "새송이버섯", emoji: "🍄", qty: 2, unit: "개", cat: "vegetable", storage: "fridge", boughtAgo: 3, expiresIn: 2, price: 2900 },
  { name: "시금치", emoji: "🥬", qty: 1, unit: "단", cat: "vegetable", storage: "fridge", boughtAgo: 2, expiresIn: 3, price: 3500 },
  { name: "상추", emoji: "🥗", qty: 1, unit: "봉", cat: "vegetable", storage: "fridge", boughtAgo: 2, expiresIn: 2, price: 2500 },
  { name: "대파", emoji: "🌿", qty: 1, unit: "단", cat: "vegetable", storage: "fridge", boughtAgo: 3, expiresIn: 4, price: 1800 },
  { name: "양파", emoji: "🧅", qty: 3, unit: "개", cat: "vegetable", storage: "pantry", boughtAgo: 7, expiresIn: 12, price: 2700 },
  { name: "감자", emoji: "🥔", qty: 4, unit: "개", cat: "vegetable", storage: "pantry", boughtAgo: 8, expiresIn: 14, price: 3200 },
  { name: "당근", emoji: "🥕", qty: 2, unit: "개", cat: "vegetable", storage: "fridge", boughtAgo: 5, expiresIn: 7, price: 1600 },
  { name: "토마토", emoji: "🍅", qty: 4, unit: "개", cat: "vegetable", storage: "fridge", boughtAgo: 2, expiresIn: 4, price: 5900 },
  { name: "애호박", emoji: "🥒", qty: 1, unit: "개", cat: "vegetable", storage: "fridge", boughtAgo: 3, expiresIn: 5, price: 1900 },
  { name: "청양고추", emoji: "🌶️", qty: 5, unit: "개", cat: "vegetable", storage: "fridge", boughtAgo: 4, expiresIn: 6, price: 1200 },
  { name: "김치", emoji: "🥟", qty: 1, unit: "통", cat: "processed", storage: "fridge", boughtAgo: 20, expiresIn: 40, price: 12000, memo: "잘 익은 김장김치" },
  { name: "계란", emoji: "🥚", qty: 8, unit: "개", cat: "egg", storage: "fridge", boughtAgo: 5, expiresIn: 16, price: 6500 },
  { name: "체다치즈", emoji: "🧀", qty: 6, unit: "장", cat: "dairy", storage: "fridge", boughtAgo: 10, expiresIn: 21, price: 4300 },
  { name: "요거트", emoji: "🍶", qty: 2, unit: "개", cat: "dairy", storage: "fridge", boughtAgo: 3, expiresIn: 5, price: 3000 },
  { name: "버터", emoji: "🧈", qty: 1, unit: "개", cat: "dairy", storage: "fridge", boughtAgo: 15, expiresIn: 45, price: 5900 },
  { name: "돼지고기 앞다리살", emoji: "🥩", qty: 400, unit: "g", cat: "meat", storage: "fridge", boughtAgo: 1, expiresIn: 3, price: 8900 },
  { name: "닭가슴살", emoji: "🍗", qty: 3, unit: "팩", cat: "meat", storage: "freezer", boughtAgo: 12, expiresIn: 48, price: 9900 },
  { name: "다진 소고기", emoji: "🥓", qty: 200, unit: "g", cat: "meat", storage: "freezer", boughtAgo: 9, expiresIn: 30, price: 7800 },
  { name: "고등어", emoji: "🐟", qty: 2, unit: "손", cat: "seafood", storage: "freezer", boughtAgo: 6, expiresIn: 25, price: 7500 },
  { name: "새우", emoji: "🦐", qty: 1, unit: "봉", cat: "seafood", storage: "freezer", boughtAgo: 14, expiresIn: 35, price: 9800 },
  { name: "사과", emoji: "🍎", qty: 3, unit: "개", cat: "fruit", storage: "fridge", boughtAgo: 4, expiresIn: 10, price: 6900 },
  { name: "바나나", emoji: "🍌", qty: 4, unit: "개", cat: "fruit", storage: "pantry", boughtAgo: 2, expiresIn: 3, price: 3900 },
  { name: "블루베리", emoji: "🫐", qty: 1, unit: "팩", cat: "fruit", storage: "fridge", boughtAgo: 1, expiresIn: 5, price: 5500 },
  { name: "레몬", emoji: "🍋", qty: 2, unit: "개", cat: "fruit", storage: "fridge", boughtAgo: 6, expiresIn: 15, price: 2400 },
  { name: "간장", emoji: "🫙", qty: 1, unit: "병", cat: "sauce", storage: "pantry", boughtAgo: 60, expiresIn: 300, price: 4800 },
  { name: "고추장", emoji: "🌶️", qty: 1, unit: "통", cat: "sauce", storage: "fridge", boughtAgo: 45, expiresIn: 200, price: 6800 },
  { name: "된장", emoji: "🫘", qty: 1, unit: "통", cat: "sauce", storage: "fridge", boughtAgo: 45, expiresIn: 220, price: 5900 },
  { name: "참기름", emoji: "🫗", qty: 1, unit: "병", cat: "sauce", storage: "pantry", boughtAgo: 30, expiresIn: 180, price: 7200 },
  { name: "식빵", emoji: "🍞", qty: 1, unit: "봉", cat: "processed", storage: "pantry", boughtAgo: 1, expiresIn: 4, price: 3400 },
  { name: "어묵", emoji: "🍢", qty: 1, unit: "봉", cat: "processed", storage: "fridge", boughtAgo: 2, expiresIn: 6, price: 2800 },
  { name: "우동면", emoji: "🍜", qty: 2, unit: "개", cat: "processed", storage: "fridge", boughtAgo: 5, expiresIn: 9, price: 2600 },
  { name: "쌀", emoji: "🍚", qty: 1, unit: "포", cat: "etc", storage: "pantry", boughtAgo: 25, expiresIn: null, price: 29000 },
];

export function buildDemoIngredients(): Ingredient[] {
  const today = todayStart();
  return INGREDIENT_SEEDS.map((s) => ({
    id: id("ing"),
    name: s.name,
    emoji: s.emoji,
    quantity: s.qty,
    unit: s.unit,
    category: s.cat,
    storage: s.storage,
    purchasedAt: toISODate(addDays(today, -s.boughtAgo)),
    expiresAt: s.expiresIn === null ? null : toISODate(addDays(today, s.expiresIn)),
    memo: s.memo,
    price: s.price,
    status: "available",
  }));
}

export const RECIPES: Recipe[] = [
  {
    id: "recipe_tofu_mushroom_jeongol",
    name: "버섯 두부전골",
    emoji: "🍲",
    image: "tofu-mushroom-jeongol",
    minutes: 20,
    difficulty: "쉬움",
    servings: 2,
    description: "냉장고 속 두부와 버섯으로 끓이는 따뜻한 한 냄비 요리예요.",
    ingredients: [
      { name: "두부", amount: "1모", consume: 1, essential: true },
      { name: "새송이버섯", amount: "2개", consume: 2, essential: true },
      { name: "대파", amount: "1/2단", consume: 0.5, essential: true },
      { name: "청양고추", amount: "2개", consume: 2, essential: false },
      { name: "간장", amount: "2큰술", consume: 0, essential: true },
      { name: "된장", amount: "1/2큰술", consume: 0, essential: false },
    ],
    steps: [
      "두부는 도톰하게, 버섯은 결대로 먹기 좋게 썰어주세요.",
      "냄비에 물 500ml와 된장 1/2큰술을 풀고 끓여주세요.",
      "국물이 끓으면 두부·버섯·대파를 넣고 5분 더 끓여주세요.",
      "간장과 고추로 간을 맞추고 한소끔 끓인 뒤 마무리해요.",
    ],
  },
  {
    id: "recipe_tomato_egg",
    name: "토마토 계란볶음",
    emoji: "🍳",
    image: "tomato-egg",
    minutes: 10,
    difficulty: "쉬움",
    servings: 1,
    description: "잘 익은 토마토와 계란만 있으면 완성되는 초간단 반찬이에요.",
    ingredients: [
      { name: "토마토", amount: "2개", consume: 2, essential: true },
      { name: "계란", amount: "3개", consume: 3, essential: true },
      { name: "대파", amount: "약간", consume: 0, essential: false },
      { name: "참기름", amount: "1작은술", consume: 0, essential: false },
    ],
    steps: [
      "토마토는 웨지 모양으로, 대파는 송송 썰어 준비해요.",
      "계란을 풀어 팬에서 부드럽게 스크램블한 뒤 덜어두세요.",
      "같은 팬에 토마토를 볶다가 계란을 다시 넣어 섞어요.",
      "소금으로 간하고 참기름을 둘러 마무리해요.",
    ],
  },
  {
    id: "recipe_spinach_tofu_muchim",
    name: "시금치 두부무침",
    emoji: "🥗",
    image: "spinach-tofu-muchim",
    minutes: 15,
    difficulty: "쉬움",
    servings: 2,
    description: "데친 시금치와 으깬 두부를 고소하게 무친 건강 반찬이에요.",
    ingredients: [
      { name: "시금치", amount: "1단", consume: 1, essential: true },
      { name: "두부", amount: "1/2모", consume: 0.5, essential: true },
      { name: "참기름", amount: "1큰술", consume: 0, essential: true },
      { name: "간장", amount: "1큰술", consume: 0, essential: true },
    ],
    steps: [
      "시금치는 끓는 물에 30초 데쳐 찬물에 헹궈 물기를 짜요.",
      "두부는 데친 뒤 면보로 물기를 제거하고 곱게 으깨요.",
      "시금치·두부에 간장·참기름을 넣고 조물조물 무쳐요.",
      "통깨를 뿌려 마무리해요.",
    ],
  },
  {
    id: "recipe_kimchi_fried_rice",
    name: "김치볶음밥",
    emoji: "🍛",
    image: "kimchi-fried-rice",
    minutes: 15,
    difficulty: "쉬움",
    servings: 1,
    description: "잘 익은 김치 하나로 실패 없는 한 그릇 요리를 만들어요.",
    ingredients: [
      { name: "김치", amount: "1컵", consume: 0, essential: true },
      { name: "쌀", amount: "밥 1공기", consume: 0, essential: true },
      { name: "계란", amount: "1개", consume: 1, essential: false },
      { name: "대파", amount: "1/4단", consume: 0.25, essential: false },
      { name: "참기름", amount: "1작은술", consume: 0, essential: false },
    ],
    steps: [
      "김치는 잘게 썰고 대파는 송송 썰어 준비해요.",
      "팬에 기름을 두르고 파를 볶아 파기름을 내요.",
      "김치를 볶다가 밥을 넣고 고루 섞으며 볶아요.",
      "참기름으로 마무리하고 계란프라이를 올려요.",
    ],
  },
  {
    id: "recipe_egg_roll",
    name: "계란말이",
    emoji: "🥚",
    image: "egg-roll",
    minutes: 10,
    difficulty: "쉬움",
    servings: 2,
    description: "폭신하게 말아내는 기본 반찬, 냉장고 채소를 더해도 좋아요.",
    ingredients: [
      { name: "계란", amount: "4개", consume: 4, essential: true },
      { name: "대파", amount: "약간", consume: 0, essential: false },
      { name: "당근", amount: "1/4개", consume: 0.25, essential: false },
    ],
    steps: [
      "계란을 풀고 잘게 썬 채소를 섞어요.",
      "약불 팬에 계란물 1/3을 붓고 반쯤 익으면 돌돌 말아요.",
      "남은 계란물을 나눠 부으며 말기를 반복해요.",
      "한 김 식힌 뒤 먹기 좋게 썰어요.",
    ],
  },
  {
    id: "recipe_pork_kimchi_jjigae",
    name: "돼지고기 김치찌개",
    emoji: "🥘",
    image: "pork-kimchi-jjigae",
    minutes: 30,
    difficulty: "보통",
    servings: 2,
    description: "돼지고기와 신김치로 끓이는 진한 국물의 정석 찌개예요.",
    ingredients: [
      { name: "돼지고기 앞다리살", amount: "200g", consume: 200, essential: true },
      { name: "김치", amount: "1/4포기", consume: 0, essential: true },
      { name: "두부", amount: "1/2모", consume: 0.5, essential: false },
      { name: "대파", amount: "1/2단", consume: 0.5, essential: false },
      { name: "고추장", amount: "1/2큰술", consume: 0, essential: false },
    ],
    steps: [
      "냄비에 돼지고기를 볶다가 김치를 넣고 함께 볶아요.",
      "물 600ml를 붓고 15분 정도 끓여요.",
      "두부와 대파를 넣고 5분 더 끓여요.",
      "고추장으로 간을 맞추고 마무리해요.",
    ],
  },
  {
    id: "recipe_potato_stirfry",
    name: "감자채볶음",
    emoji: "🥔",
    image: "potato-stirfry",
    minutes: 15,
    difficulty: "쉬움",
    servings: 2,
    description: "아삭하게 볶아낸 감자채, 도시락 반찬으로도 좋아요.",
    ingredients: [
      { name: "감자", amount: "2개", consume: 2, essential: true },
      { name: "양파", amount: "1/2개", consume: 0.5, essential: false },
      { name: "당근", amount: "1/4개", consume: 0.25, essential: false },
    ],
    steps: [
      "감자는 채 썰어 물에 헹궈 전분을 빼요.",
      "팬에 기름을 두르고 감자·양파·당근을 볶아요.",
      "소금으로 간하고 감자가 투명해지면 마무리해요.",
    ],
  },
  {
    id: "recipe_chicken_salad",
    name: "닭가슴살 샐러드",
    emoji: "🥗",
    image: "chicken-salad",
    minutes: 15,
    difficulty: "쉬움",
    servings: 1,
    description: "촉촉한 닭가슴살과 신선한 채소로 가볍게 즐기는 한 끼예요.",
    ingredients: [
      { name: "닭가슴살", amount: "1팩", consume: 1, essential: true },
      { name: "상추", amount: "1/2봉", consume: 0.5, essential: true },
      { name: "토마토", amount: "1개", consume: 1, essential: false },
      { name: "레몬", amount: "1/2개", consume: 0.5, essential: false },
    ],
    steps: [
      "닭가슴살은 삶거나 에어프라이어에 익혀 결대로 찢어요.",
      "상추와 토마토를 먹기 좋게 썰어 담아요.",
      "레몬즙·올리브오일·소금으로 드레싱을 만들어요.",
      "재료 위에 드레싱을 뿌려 마무리해요.",
    ],
  },
  {
    id: "recipe_mackerel_gui",
    name: "고등어구이",
    emoji: "🐟",
    image: "mackerel-gui",
    minutes: 20,
    difficulty: "쉬움",
    servings: 2,
    description: "노릇하게 구운 고등어 한 손이면 저녁 메인 완성이에요.",
    ingredients: [
      { name: "고등어", amount: "1손", consume: 1, essential: true },
      { name: "레몬", amount: "1/2개", consume: 0.5, essential: false },
    ],
    steps: [
      "고등어는 해동 후 물기를 닦고 칼집을 내요.",
      "팬 또는 에어프라이어에서 앞뒤로 노릇하게 구워요.",
      "레몬을 곁들여 마무리해요.",
    ],
  },
  {
    id: "recipe_tofu_jorim",
    name: "두부조림",
    emoji: "🍽️",
    image: "tofu-jorim",
    minutes: 20,
    difficulty: "쉬움",
    servings: 2,
    description: "매콤짭짤한 양념이 스며든 밥도둑 반찬이에요.",
    ingredients: [
      { name: "두부", amount: "1모", consume: 1, essential: true },
      { name: "대파", amount: "1/4단", consume: 0.25, essential: false },
      { name: "간장", amount: "3큰술", consume: 0, essential: true },
      { name: "청양고추", amount: "1개", consume: 1, essential: false },
    ],
    steps: [
      "두부는 도톰하게 썰어 팬에 노릇하게 구워요.",
      "간장·고춧가루·다진 마늘로 양념장을 만들어요.",
      "두부 위에 양념장을 올리고 물 1/2컵을 부어 조려요.",
      "대파·고추를 올리고 국물이 자작해지면 마무리해요.",
    ],
  },
  {
    id: "recipe_veggie_stirfry",
    name: "채소 모둠볶음",
    emoji: "🥦",
    image: "veggie-stirfry",
    minutes: 12,
    difficulty: "쉬움",
    servings: 2,
    description: "남은 채소를 한 번에 처리하는 만능 볶음이에요.",
    ingredients: [
      { name: "애호박", amount: "1/2개", consume: 0.5, essential: true },
      { name: "양파", amount: "1/2개", consume: 0.5, essential: true },
      { name: "당근", amount: "1/3개", consume: 0.33, essential: false },
      { name: "새송이버섯", amount: "1개", consume: 1, essential: false },
    ],
    steps: [
      "채소를 비슷한 크기로 썰어 준비해요.",
      "팬에 기름을 두르고 단단한 채소부터 볶아요.",
      "굴소스나 소금으로 간해 마무리해요.",
    ],
  },
  {
    id: "recipe_banana_yogurt",
    name: "바나나 요거트볼",
    emoji: "🍌",
    image: "banana-yogurt",
    minutes: 5,
    difficulty: "쉬움",
    servings: 1,
    description: "아침 대용으로 좋은 5분 완성 요거트볼이에요.",
    ingredients: [
      { name: "바나나", amount: "1개", consume: 1, essential: true },
      { name: "요거트", amount: "1개", consume: 1, essential: true },
      { name: "블루베리", amount: "한 줌", consume: 0, essential: false },
    ],
    steps: [
      "그릇에 요거트를 담아요.",
      "바나나를 썰어 올리고 블루베리를 곁들여요.",
      "꿀이나 그래놀라를 뿌리면 더 좋아요.",
    ],
  },
  {
    id: "recipe_french_toast",
    name: "프렌치토스트",
    emoji: "🍞",
    image: "french-toast",
    minutes: 15,
    difficulty: "쉬움",
    servings: 2,
    description: "우유·계란·식빵으로 만드는 촉촉한 브런치 메뉴예요.",
    ingredients: [
      { name: "식빵", amount: "4장", consume: 0.5, essential: true },
      { name: "계란", amount: "2개", consume: 2, essential: true },
      { name: "우유", amount: "1/2컵", consume: 0.5, essential: true },
      { name: "버터", amount: "1조각", consume: 0, essential: false },
    ],
    steps: [
      "계란과 우유를 섞어 계란물을 만들어요.",
      "식빵을 계란물에 충분히 적셔요.",
      "버터 두른 팬에 약불로 앞뒤 노릇하게 구워요.",
      "꿀이나 설탕을 뿌려 마무리해요.",
    ],
  },
  {
    id: "recipe_udon",
    name: "어묵우동",
    emoji: "🍜",
    image: "udon",
    minutes: 12,
    difficulty: "쉬움",
    servings: 1,
    description: "쫄깃한 우동면과 어묵으로 끓이는 따끈한 국물 요리예요.",
    ingredients: [
      { name: "우동면", amount: "1개", consume: 1, essential: true },
      { name: "어묵", amount: "1/2봉", consume: 0.5, essential: true },
      { name: "대파", amount: "약간", consume: 0, essential: false },
      { name: "간장", amount: "1큰술", consume: 0, essential: true },
    ],
    steps: [
      "냄비에 물 400ml와 간장으로 국물을 내요.",
      "어묵을 넣고 한소끔 끓여요.",
      "우동면을 넣고 2분간 더 끓여요.",
      "대파를 올려 마무리해요.",
    ],
  },
  {
    id: "recipe_shrimp_fried_rice",
    name: "새우 계란볶음밥",
    emoji: "🦐",
    image: "shrimp-fried-rice",
    minutes: 15,
    difficulty: "보통",
    servings: 1,
    description: "탱글한 새우와 고슬한 밥으로 만드는 중화풍 볶음밥이에요.",
    ingredients: [
      { name: "새우", amount: "1/2봉", consume: 0.5, essential: true },
      { name: "계란", amount: "2개", consume: 2, essential: true },
      { name: "쌀", amount: "밥 1공기", consume: 0, essential: true },
      { name: "대파", amount: "1/4단", consume: 0.25, essential: false },
    ],
    steps: [
      "새우는 해동해 물기를 제거해요.",
      "팬에 파기름을 내고 새우를 볶아 덜어둬요.",
      "계란을 스크램블하고 밥을 넣어 볶아요.",
      "새우를 다시 넣고 소금 간해 마무리해요.",
    ],
  },
  {
    id: "recipe_beef_soboro",
    name: "소고기 소보로덮밥",
    emoji: "🍚",
    image: "beef-soboro",
    minutes: 15,
    difficulty: "쉬움",
    servings: 1,
    description: "달짝지근한 다진 소고기를 밥에 얹어 먹는 한 그릇이에요.",
    ingredients: [
      { name: "다진 소고기", amount: "150g", consume: 150, essential: true },
      { name: "계란", amount: "1개", consume: 1, essential: false },
      { name: "간장", amount: "2큰술", consume: 0, essential: true },
      { name: "쌀", amount: "밥 1공기", consume: 0, essential: true },
    ],
    steps: [
      "팬에 다진 소고기를 볶다가 간장·설탕으로 간해요.",
      "계란은 스크램블로 부드럽게 익혀요.",
      "밥 위에 소고기와 계란을 반반 얹어 마무리해요.",
    ],
  },
];

export function buildDemoLogs(): ConsumptionLog[] {
  const today = todayStart();
  const mk = (
    daysAgo: number,
    name: string,
    emoji: string,
    category: ConsumptionLog["category"],
    type: ConsumptionLog["type"],
    price: number,
    reason?: ConsumptionLog["reason"],
    via?: string
  ): ConsumptionLog => ({
    id: id("log"),
    ingredientName: name,
    emoji,
    category,
    type,
    date: toISODate(addDays(today, -daysAgo)),
    price,
    reason,
    via,
  });

  return [
    mk(1, "우유", "🥛", "dairy", "consumed", 3100, undefined, "그대로 먹었어요"),
    mk(1, "느타리버섯", "🍄", "vegetable", "consumed", 2600, undefined, "버섯전"),
    mk(2, "상추", "🥗", "vegetable", "discarded", 2500, "보관 실패"),
    mk(2, "계란", "🥚", "egg", "consumed", 800, undefined, "계란말이"),
    mk(3, "닭가슴살", "🍗", "meat", "consumed", 3300, undefined, "닭가슴살 샐러드"),
    mk(4, "바나나", "🍌", "fruit", "consumed", 1000, undefined, "바나나 요거트볼"),
    mk(5, "애호박", "🥒", "vegetable", "consumed", 1900, undefined, "된장찌개"),
    mk(6, "두부", "🧈", "processed", "consumed", 2400, undefined, "두부조림"),
    mk(8, "깻잎", "🌿", "vegetable", "discarded", 2000, "유통기한 지남"),
    mk(10, "요거트", "🍶", "dairy", "consumed", 1500, undefined, "그대로 먹었어요"),
    mk(12, "토마토", "🍅", "vegetable", "consumed", 1500, undefined, "토마토 계란볶음"),
    mk(14, "블루베리", "🫐", "fruit", "discarded", 5500, "먹을 기회 없음"),
    mk(16, "식빵", "🍞", "processed", "consumed", 3400, undefined, "프렌치토스트"),
    mk(18, "우유", "🥛", "dairy", "discarded", 3200, "유통기한 지남"),
    mk(21, "시금치", "🥬", "vegetable", "consumed", 3500, undefined, "시금치 두부무침"),
    mk(24, "돼지고기 앞다리살", "🥩", "meat", "consumed", 8900, undefined, "돼지고기 김치찌개"),
    mk(26, "당근", "🥕", "vegetable", "discarded", 1600, "너무 많이 구매"),
  ];
}

export function buildDemoShopping(): ShoppingItem[] {
  return [
    { id: id("shop"), name: "고춧가루", checked: false },
    { id: id("shop"), name: "양배추", checked: false },
    { id: id("shop"), name: "올리브오일", checked: true },
  ];
}

export function buildDemoNotifications(): AppNotification[] {
  const today = todayStart();
  return [
    {
      id: id("noti"),
      title: "우유의 유통기한이 내일이에요",
      body: "냉장실의 우유 1팩, 내일까지 드시는 게 좋아요.",
      date: toISODate(today),
      read: false,
      kind: "expiry",
    },
    {
      id: id("noti"),
      title: "오늘 저녁 추천: 버섯 두부전골",
      body: "두부와 새송이버섯으로 오늘 저녁을 만들어보세요.",
      date: toISODate(today),
      read: false,
      kind: "recipe",
    },
    {
      id: id("noti"),
      title: "냉동 닭가슴살 보관 12일째",
      body: "냉동 보관 중인 닭가슴살, 잊지 말고 활용해보세요.",
      date: toISODate(addDays(today, -1)),
      read: false,
      kind: "tip",
    },
    {
      id: id("noti"),
      title: "지난주 절약 리포트가 도착했어요",
      body: "지난주 6개의 식재료를 버리지 않고 사용했어요.",
      date: toISODate(addDays(today, -2)),
      read: true,
      kind: "tip",
    },
  ];
}

export function buildInitialState(): AppState {
  return {
    userName: "지현",
    ingredients: buildDemoIngredients(),
    logs: buildDemoLogs(),
    shopping: buildDemoShopping(),
    notifications: buildDemoNotifications(),
    seededAt: toISODate(todayStart()),
  };
}

export function newId(prefix: string): string {
  return id(prefix);
}
