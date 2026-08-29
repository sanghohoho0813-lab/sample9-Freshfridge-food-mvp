"use client";

import Image from "next/image";
import { ingredientImage } from "@/lib/images";

/** 식재료 1:1 썸네일. 이미지가 없는 식재료는 이모지로 폴백한다. */
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
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          className="object-contain p-1"
        />
      ) : (
        <span aria-hidden>{emoji}</span>
      )}
    </span>
  );
}
