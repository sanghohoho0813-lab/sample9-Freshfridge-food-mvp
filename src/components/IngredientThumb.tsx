"use client";

import Image from "next/image";
import { ingredientImage } from "@/lib/images";

/**
 * 식재료 1:1 썸네일. 이미지가 없는 식재료는 이모지로 폴백한다.
 * 늘 옆에 이름이 함께 쓰이므로 기본은 장식 이미지(alt="") — 화면 읽기에서 이름을 두 번 읽지 않게.
 */
export default function IngredientThumb({
  name,
  emoji,
  className = "",
  sizes = "64px",
}: {
  name: string;
  emoji: string;
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
        <span aria-hidden>{emoji}</span>
      )}
    </span>
  );
}
