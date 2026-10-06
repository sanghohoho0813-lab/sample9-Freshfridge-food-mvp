"use client";

import { useRef, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { StorageType } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { ingredientDefaults } from "@/lib/demo-data";
import { addDays, formatKoreanDate, shelfLabel, toISODate, todayStart } from "@/lib/expiry-calculator";
import { josa } from "@/lib/text";
import { amountStep, formatAmount } from "@/lib/quantity";
import IngredientThumb from "./IngredientThumb";
import Portal from "./Portal";
import { useEscape } from "./ui/useEscape";

export interface QuickAddValue {
  name: string;
  quantity: number;
  unit: string;
  storage: StorageType;
  expiresAt: string | null;
}

const EXPIRY_PRESETS = [3, 7, 14, 30];

/**
 * 장보기에서 산 재료를 냉장고에 넣는 빠른 시트.
 * 재료별 기본값(단위·보관위치·보관기간)을 미리 채워두고, 사용자가 확인 후 넣는다.
 */
export default function QuickAddSheet({
  name,
  onConfirm,
  onClose,
}: {
  name: string;
  onConfirm: (value: QuickAddValue) => void;
  onClose: () => void;
}) {
  const d = ingredientDefaults(name);
  const step = amountStep(d.unit);
  const [quantity, setQuantity] = useState(d.unit === "g" ? 300 : step);
  const [storage, setStorage] = useState<StorageType>(d.storage);
  const [days, setDays] = useState<number | null>(d.shelfDays);

  const expiresAt = days === null ? null : toISODate(addDays(todayStart(), days));
  useEscape(onClose);
  const done = useRef(false);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 backdrop-blur-[2px] sm:items-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        <div
          className="max-h-[88dvh] w-full max-w-md animate-pop-in overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-lift sm:rounded-3xl sm:pb-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <IngredientThumb name={name} emoji={d.emoji} className="h-14 w-14 bg-fresh-50 text-2xl" sizes="56px" />
            <div className="min-w-0 flex-1">
              <h3 id="quick-add-title" className="text-[20.5px] font-extrabold text-ink-900">
                {josa(name, "을/를")} 냉장고에 넣을까요?
              </h3>
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

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-warmwhite p-3">
              <p className="pl-1 text-[16.5px] font-semibold text-ink-700">수량</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="줄이기"
                  onClick={() => setQuantity((q) => Math.max(step, q - step))}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white active:scale-95"
                >
                  <Minus size={18} />
                </button>
                <span className="min-w-[72px] text-center text-[20.5px] font-extrabold tabular-nums">
                  {formatAmount(quantity, d.unit)}
                </span>
                <button
                  type="button"
                  aria-label="늘리기"
                  onClick={() => setQuantity((q) => q + step)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[15.5px] font-bold text-ink-700">보관 위치</p>
              <div className="flex gap-2">
                {(Object.keys(STORAGE_LABELS) as StorageType[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={storage === s}
                    onClick={() => setStorage(s)}
                    className={`chip min-h-[44px] flex-1 justify-center border ${
                      storage === s
                        ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                        : "border-ink-300/30 bg-white text-ink-500"
                    }`}
                  >
                    {STORAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[15.5px] font-bold text-ink-700">
                유통기한{" "}
                <span className="font-medium text-ink-400">
                  {expiresAt ? `· ${formatKoreanDate(expiresAt)}까지` : "· 모름"}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...(d.shelfDays ? [d.shelfDays] : []), ...EXPIRY_PRESETS])]
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={days === n}
                      onClick={() => setDays(n)}
                      className={`chip min-h-[44px] border ${
                        days === n
                          ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                          : "border-ink-300/30 bg-white text-ink-500"
                      }`}
                    >
                      {shelfLabel(n)}
                    </button>
                  ))}
                <button
                  type="button"
                  aria-pressed={days === null}
                  onClick={() => setDays(null)}
                  className={`chip min-h-[44px] border ${
                    days === null
                      ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                      : "border-ink-300/30 bg-white text-ink-500"
                  }`}
                >
                  모름
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost min-h-[52px] flex-1">
              나중에
            </button>
            <button
              type="button"
              onClick={() => {
                if (done.current) return; // 연타로 두 번 들어가지 않게
                done.current = true;
                onConfirm({ name, quantity, unit: d.unit, storage, expiresAt });
              }}
              className="btn-primary min-h-[52px] flex-[1.4]"
            >
              냉장고에 넣기
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
