export type StorageType = "fridge" | "freezer" | "pantry";

export type IngredientCategory =
  | "vegetable"
  | "fruit"
  | "meat"
  | "seafood"
  | "dairy"
  | "egg"
  | "sauce"
  | "processed"
  | "etc";

export type IngredientStatus =
  | "available"
  | "consume_soon"
  | "urgent"
  | "consumed"
  | "discarded";

export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  storage: StorageType;
  purchasedAt: string; // ISO date
  expiresAt: string | null; // ISO date, null = 정보 없음
  memo?: string;
  price: number; // 예상 금액(원) — 절약 리포트 데모용
  status: IngredientStatus;
}

export interface RecipeIngredient {
  name: string; // 식재료명으로 매칭
  amount: string; // 표시용 (예: "1/2모")
  consume: number; // 요리 완료 시 차감 수량
  essential: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  /** 대표이미지 슬러그 (/public/images/recipes/{slug}.png) */
  image: string;
  minutes: number;
  difficulty: "쉬움" | "보통" | "어려움";
  servings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  description: string;
}

export type WasteReason =
  | "유통기한 지남"
  | "너무 많이 구매"
  | "먹을 기회 없음"
  | "보관 실패"
  | "기타";

export interface ConsumptionLog {
  id: string;
  ingredientName: string;
  emoji: string;
  category: IngredientCategory;
  type: "consumed" | "discarded";
  date: string; // ISO date
  price: number; // 이 기록에 해당하는 금액 (부분 소비면 비례 금액)
  reason?: WasteReason;
  via?: string; // 레시피명 등
  amount?: number; // 이번에 먹거나 버린 양
  unit?: string;
  dLeft?: number | null; // 행동 시점에 남아 있던 일수 (임박 재료를 살렸는지 판단)
  cookId?: string; // 같은 요리에서 나온 기록 묶음
}

/** "요리했어요" 한 번 = 한 건. 반복 사용 동기(이번 주 N번 요리)와 기록 묶음에 쓴다. */
export interface CookLog {
  id: string;
  recipeId: string;
  recipeName: string;
  date: string; // ISO date
  usedCount: number; // 사용한 재료 종류 수
  savedAmount: number; // 사용한 재료 금액 합계
  rescuedCount: number; // 그중 D-2 이내였던 재료 수
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  fromRecipe?: string;
  addedToFridge?: boolean; // 구매 후 사용자가 직접 냉장고에 넣었는지
}

/** 알림은 저장하지 않고 현재 냉장고 상태에서 매번 계산한다 (오래된 알림 방지). */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  kind: "expiry" | "recipe" | "freezer" | "shopping" | "report";
  href: string;
}

export interface AppState {
  userName: string;
  ingredients: Ingredient[];
  logs: ConsumptionLog[];
  shopping: ShoppingItem[];
  cooks: CookLog[];
  readNotificationIds: string[];
  seededAt: string;
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  vegetable: "채소",
  fruit: "과일",
  meat: "육류",
  seafood: "수산",
  dairy: "유제품",
  egg: "계란",
  sauce: "소스",
  processed: "가공식품",
  etc: "기타",
};

export const CATEGORY_EMOJIS: Record<IngredientCategory, string> = {
  vegetable: "🥬",
  fruit: "🍎",
  meat: "🥩",
  seafood: "🐟",
  dairy: "🥛",
  egg: "🥚",
  sauce: "🧂",
  processed: "🥫",
  etc: "🧺",
};

export const STORAGE_LABELS: Record<StorageType, string> = {
  fridge: "냉장",
  freezer: "냉동",
  pantry: "실온",
};
