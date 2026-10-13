import Image from "next/image";
import { ingredientImage } from "@/lib/images";
import type { IngredientCategory } from "@/lib/types";
import CategoryIcon from "./CategoryIcon";

/**
 * 식재료 1:1 썸네일. 사진이 없는 재료(직접 등록한 새 재료 등)는 종류 아이콘으로 대신한다.
 * 늘 옆에 이름이 함께 쓰이므로 장식 이미지(alt="") — 화면 읽기에서 이름을 두 번 읽지 않게.
 */
export default function IngredientThumb({
  name,
  category = "etc",
  className = "",
  sizes = "64px",
}: {
  name: string;
  category?: IngredientCategory;
  className?: string;
  sizes?: string;
}) {
  const src = ingredientImage(name);
  return (
    <span
      className={`relative grid aspect-square shrink-0 place-items-center overflow-hidden rounded-2xl ${className}`}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={sizes} className="object-contain p-1" />
      ) : (
        <CategoryIcon category={category} size={22} className="text-ink-400" />
      )}
    </span>
  );
}
