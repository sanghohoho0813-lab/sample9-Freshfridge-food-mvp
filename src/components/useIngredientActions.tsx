"use client";

import { useCallback, useState } from "react";
import type { Ingredient } from "@/lib/types";
import { useStore, useUndoToast } from "@/lib/store";
import { amountStep, formatAmount } from "@/lib/quantity";
import IngredientActionSheet from "./IngredientActionSheet";

type Mode = "eat" | "discard";

/**
 * 먹었어요 / 버렸어요 공용 흐름.
 * - 1회분 이하만 남은 재료는 바로 처리하고, 나머지는 수량 시트를 연다.
 * - 처리 후에는 결과(남은 양)를 알려주고 되돌리기를 제공한다.
 */
export function useIngredientActions(opts?: {
  onDone?: (ingredient: Ingredient, mode: Mode, usedUp: boolean) => void;
}) {
  const { consumeIngredient, discardIngredient } = useStore();
  const undoToast = useUndoToast();
  const [sheet, setSheet] = useState<{ ingredient: Ingredient; mode: Mode } | null>(null);
  const onDone = opts?.onDone;

  const finishEat = useCallback(
    (ing: Ingredient, amount: number) => {
      const token = consumeIngredient(ing.id, amount);
      const left = Math.round((ing.quantity - amount) * 100) / 100;
      undoToast(
        left <= 0
          ? `${ing.name} 다 먹었어요! 소비 기록에 남겼어요`
          : `${ing.name} ${formatAmount(amount, ing.unit)} 먹었어요 · ${formatAmount(left, ing.unit)} 남음`,
        "✅",
        token
      );
      onDone?.(ing, "eat", left <= 0);
    },
    [consumeIngredient, undoToast, onDone]
  );

  const eat = useCallback(
    (ing: Ingredient) => {
      if (ing.quantity <= amountStep(ing.unit)) finishEat(ing, ing.quantity);
      else setSheet({ ingredient: ing, mode: "eat" });
    },
    [finishEat]
  );

  const discard = useCallback((ing: Ingredient) => setSheet({ ingredient: ing, mode: "discard" }), []);

  const element = sheet ? (
    <IngredientActionSheet
      ingredient={sheet.ingredient}
      mode={sheet.mode}
      onClose={() => setSheet(null)}
      onConfirm={(amount, reason) => {
        const ing = sheet.ingredient;
        setSheet(null);
        if (sheet.mode === "eat") {
          finishEat(ing, amount);
          return;
        }
        const token = discardIngredient(ing.id, reason ?? "기타", amount);
        const left = Math.round((ing.quantity - amount) * 100) / 100;
        undoToast(`${ing.name} ${formatAmount(amount, ing.unit)} 폐기를 기록했어요`, "📝", token);
        onDone?.(ing, "discard", left <= 0);
      }}
    />
  ) : null;

  return { eat, discard, element };
}
