"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { Ingredient, WasteReason } from "@/lib/types";
import { amountStep, defaultAmount, formatAmount } from "@/lib/quantity";
import IngredientThumb from "./IngredientThumb";
import Portal from "./Portal";
import { useEscape } from "./ui/useEscape";

const REASONS: WasteReason[] = [
  "유통기한 지남",
  "너무 많이 구매",
  "먹을 기회 없음",
  "보관 실패",
  "기타",
];

/**
 * 먹었어요 / 버렸어요 공용 시트.
 * 얼마나 먹었는지(버렸는지) 고르고, 남는 양을 미리 보여준 뒤 확정한다.
 */
export default function IngredientActionSheet({
  ingredient,
  mode,
  onConfirm,
  onClose,
}: {
  ingredient: Ingredient;
  mode: "eat" | "discard";
  onConfirm: (amount: number, reason?: WasteReason) => void;
  onClose: () => void;
}) {
  const { quantity, unit } = ingredient;
  const step = amountStep(unit);
  const [amount, setAmount] = useState(() =>
    mode === "discard" ? quantity : defaultAmount(quantity, unit)
  );
  const [reason, setReason] = useState<WasteReason>("유통기한 지남");

  const clamp = (v: number) => Math.round(Math.min(Math.max(v, Math.min(step, quantity)), quantity) * 100) / 100;
  const remaining = Math.round((quantity - amount) * 100) / 100;
  const isEat = mode === "eat";
  useEscape(onClose);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-sheet-title"
      >
        <div
          className="max-h-[88dvh] w-full max-w-md animate-pop-in overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-3xl sm:pb-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <IngredientThumb
              name={ingredient.name}
              emoji={ingredient.emoji}
              className={`h-14 w-14 text-2xl ${isEat ? "bg-fresh-50" : "bg-coral-50"}`}
              sizes="56px"
            />
            <div className="min-w-0 flex-1">
              <h3 id="action-sheet-title" className="text-[20.5px] font-extrabold text-ink-900">
                {isEat ? `${ingredient.name}, 얼마나 먹었나요?` : `${ingredient.name}, 얼마나 버렸나요?`}
              </h3>
              <p className="mt-0.5 text-[15.5px] text-ink-500">
                지금 {formatAmount(quantity, unit)} 있어요
              </p>
            </div>
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 hover:bg-ink-300/10"
            >
              <X size={22} />
            </button>
          </div>

          {/* 수량 선택 */}
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-warmwhite p-3">
            <button
              type="button"
              aria-label="줄이기"
              onClick={() => setAmount((a) => clamp(a - step))}
              disabled={amount <= Math.min(step, quantity)}
              className="grid h-12 w-12 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all active:scale-95 disabled:opacity-30"
            >
              <Minus size={20} />
            </button>
            <div className="text-center">
              <p className="text-[26px] font-extrabold tabular-nums text-ink-900">
                {formatAmount(amount, unit)}
              </p>
              <p className={`text-[14.5px] font-semibold ${remaining <= 0 ? "text-ink-400" : "text-fresh-700"}`}>
                {remaining <= 0 ? "모두 정리돼요" : `남는 양 ${formatAmount(remaining, unit)}`}
              </p>
            </div>
            <button
              type="button"
              aria-label="늘리기"
              onClick={() => setAmount((a) => clamp(a + step))}
              disabled={amount >= quantity}
              className="grid h-12 w-12 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all active:scale-95 disabled:opacity-30"
            >
              <Plus size={20} />
            </button>
          </div>
          {amount < quantity && (
            <button
              type="button"
              onClick={() => setAmount(quantity)}
              className="mt-2 w-full rounded-xl py-2 text-[15.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-300/10"
            >
              전부 ({formatAmount(quantity, unit)})
            </button>
          )}

          {/* 폐기 사유 */}
          {!isEat && (
            <div className="mt-4">
              <p className="text-[15.5px] font-bold text-ink-700">버리게 된 이유</p>
              <p className="text-[14.5px] text-ink-400">기록해두면 다음 장보기에서 낭비를 줄일 수 있어요.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`chip border ${
                      reason === r
                        ? "border-coral-400 bg-coral-50 text-coral-600"
                        : "border-ink-300/30 bg-white text-ink-500 hover:border-ink-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              취소
            </button>
            <button
              type="button"
              onClick={() => onConfirm(amount, isEat ? undefined : reason)}
              className={
                isEat
                  ? "btn-primary flex-[1.4]"
                  : "inline-flex flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-coral-500 px-4 py-2.5 text-[18.5px] font-semibold text-white transition-all duration-200 hover:bg-coral-600 active:scale-[0.98]"
              }
            >
              {isEat ? "먹었어요" : "버렸어요"} · {formatAmount(amount, unit)}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
