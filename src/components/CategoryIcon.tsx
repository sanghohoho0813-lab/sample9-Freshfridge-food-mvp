import { Apple, Beef, Carrot, Egg, Fish, Milk, Package, ShoppingBasket, Soup, type LucideIcon } from "lucide-react";
import type { IngredientCategory } from "@/lib/types";

/** 종류 아이콘 — 귀여운 이모지 대신 같은 굵기의 선 아이콘으로 통일한다 */
export const CATEGORY_ICON: Record<IngredientCategory, LucideIcon> = {
  vegetable: Carrot,
  fruit: Apple,
  meat: Beef,
  seafood: Fish,
  dairy: Milk,
  egg: Egg,
  sauce: Soup,
  processed: Package,
  etc: ShoppingBasket,
};

export default function CategoryIcon({
  category,
  size = 18,
  className = "",
}: {
  category: IngredientCategory;
  size?: number;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[category];
  return <Icon size={size} strokeWidth={2} className={className} aria-hidden />;
}
