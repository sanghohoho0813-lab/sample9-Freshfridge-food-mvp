"use client";

import Link from "next/link";
import type { Ingredient } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { expiryLevel, friendlyExpiryText } from "@/lib/expiry-calculator";
import ExpiryBadge from "./ExpiryBadge";

const TILE_BG: Record<string, string> = {
  expired: "bg-coral-50",
  urgent: "bg-coral-50",
  soon: "bg-amberish-50",
  ok: "bg-fresh-50",
  unknown: "bg-ink-300/10",
};

export default function IngredientCard({ ingredient }: { ingredient: Ingredient }) {
  const level = expiryLevel(ingredient.expiresAt);
  return (
    <Link
      href={`/ingredient/${ingredient.id}`}
      className="card card-hover flex items-center gap-3.5 p-3.5"
    >
      <span
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-[26px] ${TILE_BG[level]}`}
        aria-hidden
      >
        {ingredient.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[15px] font-bold text-ink-900">{ingredient.name}</p>
          <ExpiryBadge expiresAt={ingredient.expiresAt} size="sm" />
        </div>
        <p className="mt-0.5 text-[12.5px] text-ink-500">
          {ingredient.quantity}
          {ingredient.unit} · {STORAGE_LABELS[ingredient.storage]}
        </p>
        <p
          className={`mt-0.5 text-[12px] font-medium ${
            level === "urgent" || level === "expired"
              ? "text-coral-500"
              : level === "soon"
                ? "text-amberish-600"
                : "text-ink-400"
          }`}
        >
          {friendlyExpiryText(ingredient.expiresAt)}
        </p>
      </div>
    </Link>
  );
}
